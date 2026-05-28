"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialRecrutamentoState: FormState = { status: "idle" };

// ============================================================
// CRIAR VAGA (wizard)
// ============================================================
const vagaSchema = z.object({
  codigo: z.string().trim().min(2, "Código obrigatório"),
  titulo: z.string().trim().min(3, "Título muito curto"),
  cargo_id: z.string().uuid("Cargo obrigatório"),
  departamento_id: z.string().uuid("Departamento obrigatório"),
  gestor_solicitante_id: z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  local_trabalho_id: z
    .string()
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  modelo_trabalho: z.string().trim().optional().nullable(),
  jornada: z.string().trim().optional().nullable(),
  descricao_completa: z.string().trim().min(20, "Descreva a vaga (mín. 20 chars)"),
  responsabilidades: z.string().trim().optional().nullable(),
  requisitos_obrigatorios_text: z.string().trim().optional().nullable(),
  requisitos_desejaveis_text: z.string().trim().optional().nullable(),
  beneficios_text: z.string().trim().optional().nullable(),
  salario_min_centavos: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v === "" ? null : parseInt(v, 10)))
    .nullable(),
  salario_max_centavos: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v === "" ? null : parseInt(v, 10)))
    .nullable(),
  afirmativa: z.string().transform((v) => v === "on" || v === "true"),
  publico_alvo: z.string().trim().optional().nullable(),
  justificativa_afirmativa: z.string().trim().optional().nullable(),
  publicar: z.string().transform((v) => v === "on" || v === "true"),
});

export async function criarVaga(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "recrutador_oinora", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  for (const ck of ["afirmativa", "publicar"]) {
    if (!(ck in raw)) raw[ck] = "";
  }
  const parsed = vagaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const p = i.path.join(".");
      if (p && !fieldErrors[p]) fieldErrors[p] = i.message;
    }
    return {
      status: "error",
      message: "Verifique os campos destacados.",
      fieldErrors,
    };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { data: vaga, error } = await supabase
    .from("vagas")
    .insert({
      tenant_id: session.tenantId,
      codigo: d.codigo,
      titulo: d.titulo,
      cargo_id: d.cargo_id,
      departamento_id: d.departamento_id,
      gestor_solicitante_id: d.gestor_solicitante_id,
      local_trabalho_id: d.local_trabalho_id,
      modelo_trabalho: d.modelo_trabalho || null,
      jornada: d.jornada || null,
      descricao_completa: d.descricao_completa,
      responsabilidades: d.responsabilidades || null,
      requisitos_obrigatorios: d.requisitos_obrigatorios_text
        ? d.requisitos_obrigatorios_text.split("\n").map((s) => s.trim()).filter(Boolean)
        : null,
      requisitos_desejaveis: d.requisitos_desejaveis_text
        ? d.requisitos_desejaveis_text.split("\n").map((s) => s.trim()).filter(Boolean)
        : null,
      beneficios: d.beneficios_text
        ? d.beneficios_text.split("\n").map((s) => s.trim()).filter(Boolean)
        : null,
      salario_min_centavos: d.salario_min_centavos,
      salario_max_centavos: d.salario_max_centavos,
      afirmativa: d.afirmativa,
      publico_alvo: d.afirmativa ? (d.publico_alvo || null) : null,
      justificativa_afirmativa: d.afirmativa ? (d.justificativa_afirmativa || null) : null,
      status: d.publicar ? "publicada" : "rascunho",
      data_publicacao: d.publicar ? new Date().toISOString().slice(0, 10) : null,
      recrutador_oinora_id: session.userId,
    })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Código de vaga já existe." : error.message,
    };
  }
  revalidatePath("/recrutamento/vagas");
  revalidatePath("/portal");
  redirect(`/recrutamento/vagas/${vaga.id}`);
}

export async function pausarVaga(vagaId: string): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "recrutador_oinora"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("vagas")
    .update({ status: "pausada" })
    .eq("id", vagaId);
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/recrutamento/vagas/${vagaId}`);
  revalidatePath("/portal");
  return { status: "success", message: "Vaga pausada." };
}

export async function agendarEntrevista(
  candidaturaId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "recrutador_oinora", "hr_ops", "gestor"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const dataHora = String(formData.get("data_hora") ?? "");
  const modalidade = String(formData.get("modalidade") ?? "video");
  const linkVideo = String(formData.get("link_video") ?? "").trim() || null;

  if (!dataHora) {
    return { status: "error", message: "Data e hora obrigatórias." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("entrevistas").insert({
    candidatura_id: candidaturaId,
    tenant_id: session.tenantId,
    entrevistador_id: session.userId,
    data_hora: new Date(dataHora).toISOString(),
    modalidade,
    link_video: linkVideo,
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/recrutamento/vagas`);
  return { status: "success", message: "Entrevista agendada." };
}

export async function moverCandidato(
  candidaturaId: string,
  novoStage: string,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops", "recrutador_oinora"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("candidatura_vaga")
    .update({
      stage: novoStage,
      data_ultima_movimentacao: new Date().toISOString(),
      movimentado_por: session.userId,
    })
    .eq("id", candidaturaId)
    .select("vaga_id")
    .single();
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/recrutamento/vagas/${data.vaga_id}`);
  return { status: "success", message: "Candidato movido." };
}

export async function publicarVaga(vagaId: string): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "recrutador_oinora"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("vagas")
    .update({ status: "publicada", data_publicacao: new Date().toISOString().slice(0, 10) })
    .eq("id", vagaId);
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/recrutamento/vagas/${vagaId}`);
  revalidatePath("/portal");
  return { status: "success", message: "Vaga publicada." };
}

export async function criarCandidaturaPortal(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Esta action é chamada pelo PORTAL (anônimo) — não usa requireSession
  const vagaId = String(formData.get("vaga_id") ?? "");
  const nomeCompleto = String(formData.get("nome_completo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const aceitouLgpd = formData.get("lgpd") === "on";

  if (!vagaId || !nomeCompleto || !email) {
    return {
      status: "error",
      message: "Preencha nome e email.",
    };
  }
  if (!aceitouLgpd) {
    return {
      status: "error",
      message: "Você precisa aceitar o termo LGPD para se candidatar.",
    };
  }

  const supabase = await createClient();

  // Busca tenant_id da vaga
  const { data: vaga } = await supabase
    .from("vagas")
    .select("id, tenant_id, status")
    .eq("id", vagaId)
    .maybeSingle();
  if (!vaga || vaga.status !== "publicada") {
    return { status: "error", message: "Vaga indisponível." };
  }

  // Cria ou recupera candidato pelo email
  let candidatoId: string | null = null;
  const { data: existing } = await supabase
    .from("candidatos")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    candidatoId = existing.id;
  } else {
    const { data: novo, error: cErr } = await supabase
      .from("candidatos")
      .insert({
        nome_completo: nomeCompleto,
        email,
        telefone: telefone || null,
        cpf: cpf || null,
        aceitou_lgpd: true,
        aceitou_lgpd_em: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (cErr) return { status: "error", message: cErr.message };
    candidatoId = novo.id;
  }

  // Cria candidatura
  const { error: cvErr } = await supabase.from("candidatura_vaga").insert({
    tenant_id: vaga.tenant_id,
    vaga_id: vagaId,
    candidato_id: candidatoId,
    stage: "aplicado",
    origem: "site_proprio",
  });
  if (cvErr) {
    if (cvErr.code === "23505") {
      return {
        status: "error",
        message: "Você já se candidatou a esta vaga.",
      };
    }
    return { status: "error", message: cvErr.message };
  }

  return {
    status: "success",
    message: `Candidatura recebida! Em breve nossa equipe entrará em contato pelo email ${email}.`,
  };
}
