"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialJuridicoState: FormState = { status: "idle" };

const processoSchema = z.object({
  cnj_numero: z
    .string()
    .trim()
    .regex(
      /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
      "Formato CNJ inválido (use 0000000-00.0000.0.00.0000)",
    ),
  vara: z.string().trim().min(2, "Vara obrigatória"),
  juiz_nome: z.string().trim().optional().nullable(),
  comarca: z.string().trim().optional().nullable(),
  uf: z.string().trim().length(2, "UF com 2 letras").optional().or(z.literal("")),
  reclamante_nome: z.string().trim().min(3, "Nome do reclamante"),
  reclamante_cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  tipo_acao: z.string().trim().optional().nullable(),
  data_ajuizamento: z.string().min(1, "Data de ajuizamento obrigatória"),
  fase: z.enum([
    "pre_processual", "conhecimento", "instrucao", "sentenciado",
    "recurso_ordinario", "recurso_revista", "execucao", "acordo", "arquivado",
  ]),
  valor_causa_centavos: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v === "" ? 0 : parseInt(v, 10)))
    .refine((v) => v >= 0, "Valor inválido"),
  pleitos_text: z.string().trim().optional().nullable(),
  risco: z.enum(["remoto", "possivel", "provavel", "em_analise"]),
  provisao_centavos: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v === "" ? null : parseInt(v, 10)))
    .nullable(),
});

export async function criarProcesso(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const parsed = processoSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const p = i.path.join(".");
      if (p && !fieldErrors[p]) fieldErrors[p] = i.message;
    }
    return {
      status: "error",
      message: "Verifique os campos.",
      fieldErrors,
    };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { data: novo, error } = await supabase
    .from("processos_juridicos")
    .insert({
      tenant_id: session.tenantId,
      cnj_numero: d.cnj_numero,
      vara: d.vara,
      juiz_nome: d.juiz_nome || null,
      comarca: d.comarca || null,
      uf: d.uf || null,
      reclamante_nome: d.reclamante_nome,
      reclamante_cpf: d.reclamante_cpf,
      tipo_acao: d.tipo_acao || null,
      data_ajuizamento: d.data_ajuizamento,
      fase: d.fase,
      valor_causa_centavos: d.valor_causa_centavos,
      pleitos: d.pleitos_text
        ? d.pleitos_text.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      risco: d.risco,
      provisao_centavos: d.provisao_centavos,
      risco_definido_por: session.userId,
      risco_definido_em: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) {
    return {
      status: "error",
      message: error.code === "23505"
        ? "CNJ já cadastrado neste tenant."
        : error.message,
    };
  }
  revalidatePath("/juridico");
  redirect(`/juridico/${novo.id}`);
}

export async function adicionarAndamento(
  processoId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const dataEvento = String(formData.get("data_evento") ?? "");
  const tipo = String(formData.get("tipo") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  if (!dataEvento || !tipo || !titulo) {
    return { status: "error", message: "Data, tipo e título são obrigatórios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("processo_andamentos").insert({
    tenant_id: session.tenantId,
    processo_id: processoId,
    data_evento: new Date(dataEvento).toISOString(),
    tipo,
    titulo,
    descricao,
    registrado_por: session.userId,
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/juridico/${processoId}`);
  return { status: "success", message: "Andamento registrado." };
}

export async function registrarAudiencia(
  processoId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const dataHora = String(formData.get("data_hora") ?? "");
  const tipo = String(formData.get("tipo") ?? "").trim();
  const vara = String(formData.get("vara") ?? "").trim() || null;
  const sala = String(formData.get("sala") ?? "").trim() || null;
  const preposto = String(formData.get("preposto_nome") ?? "").trim() || null;

  if (!dataHora || !tipo) {
    return { status: "error", message: "Data e tipo obrigatórios." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("processo_audiencias").insert({
    tenant_id: session.tenantId,
    processo_id: processoId,
    data_hora: new Date(dataHora).toISOString(),
    tipo,
    vara,
    sala,
    preposto_nome: preposto,
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/juridico/${processoId}`);
  return { status: "success", message: "Audiência registrada." };
}

export async function definirRisco(
  processoId: string,
  risco: string,
  provisaoCentavos: number,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("processos_juridicos")
    .update({
      risco,
      provisao_centavos: provisaoCentavos,
      risco_definido_por: session.userId,
      risco_definido_em: new Date().toISOString(),
    })
    .eq("id", processoId);
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/juridico/${processoId}`);
  return { status: "success", message: "Risco atualizado." };
}

export async function registrarAcordo(
  processoId: string,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "advogado_interno", "advogado_externo"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const dataAcordo = String(formData.get("data_acordo") ?? "");
  const valor = parseInt(String(formData.get("valor_acordo_centavos") ?? "").replace(/\D/g, ""), 10);
  const parcelas = parseInt(String(formData.get("numero_parcelas") ?? "1"), 10);
  if (!dataAcordo || !valor || Number.isNaN(valor)) {
    return { status: "error", message: "Data e valor obrigatórios." };
  }
  const supabase = await createClient();
  await supabase.from("processo_acordos").insert({
    tenant_id: session.tenantId,
    processo_id: processoId,
    data_acordo: dataAcordo,
    valor_acordo_centavos: valor,
    numero_parcelas: parcelas,
  });
  await supabase
    .from("processos_juridicos")
    .update({ status: "encerrado_acordo", fase: "acordo" })
    .eq("id", processoId);
  revalidatePath(`/juridico/${processoId}`);
  return { status: "success", message: "Acordo registrado." };
}
