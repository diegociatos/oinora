"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export async function gerarCompetencia(competencia: string): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();

  // Verifica se já existe
  const { data: existente } = await supabase
    .from("folha_competencias")
    .select("id")
    .eq("competencia", competencia)
    .maybeSingle();
  if (existente) {
    return { status: "error", message: "Competência já existe." };
  }

  // Busca empregados ativos
  const { data: empregados } = await supabase
    .from("empregados")
    .select("id, salario_centavos")
    .eq("status", "ativo");

  const totalEmp = empregados?.length ?? 0;
  const totalSalarios = (empregados ?? []).reduce((s, e) => s + e.salario_centavos, 0);
  // Cálculo simplificado para preview (sem INSS/IRRF reais)
  const inssEstim = Math.round(totalSalarios * 0.105); // ~10.5% médio
  const irrfEstim = Math.round(totalSalarios * 0.08); // estimativa
  const fgtsEstim = Math.round(totalSalarios * 0.08);
  const inssPatronal = Math.round(totalSalarios * 0.20);
  const liquido = totalSalarios - inssEstim - irrfEstim;

  const { data: comp, error } = await supabase
    .from("folha_competencias")
    .insert({
      tenant_id: session.tenantId,
      competencia,
      status: "calculando",
      total_proventos_centavos: totalSalarios,
      total_descontos_centavos: inssEstim + irrfEstim,
      total_liquido_centavos: liquido,
      total_empregados: totalEmp,
      encargos_inss_patronal_centavos: inssPatronal,
      encargos_fgts_centavos: fgtsEstim,
    })
    .select("id")
    .single();

  if (error || !comp) return { status: "error", message: error?.message ?? "Erro" };

  // Cria holerites estimados
  if (empregados && empregados.length > 0) {
    const holerites = empregados.map((e) => {
      const inss = Math.round(e.salario_centavos * 0.105);
      const irrf = Math.round(e.salario_centavos * 0.08);
      const fgts = Math.round(e.salario_centavos * 0.08);
      return {
        tenant_id: session.tenantId,
        competencia_id: comp.id,
        empregado_id: e.id,
        salario_base_centavos: e.salario_centavos,
        total_proventos_centavos: e.salario_centavos,
        total_descontos_centavos: inss + irrf,
        total_liquido_centavos: e.salario_centavos - inss - irrf,
        inss_base_centavos: e.salario_centavos,
        inss_desconto_centavos: inss,
        irrf_base_centavos: e.salario_centavos - inss,
        irrf_desconto_centavos: irrf,
        fgts_base_centavos: e.salario_centavos,
        fgts_centavos: fgts,
      };
    });
    await supabase.from("folha_holerites").insert(holerites);
  }

  revalidatePath("/folha");
  return { status: "success", message: `Competência gerada com ${totalEmp} holerites.` };
}

export async function fecharCompetencia(competenciaId: string): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("folha_competencias")
    .update({
      status: "fechada",
      fechada_em: new Date().toISOString(),
      fechada_por: session.userId,
    })
    .eq("id", competenciaId);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/folha");
  revalidatePath(`/folha/${competenciaId}`);
  return { status: "success", message: "Competência fechada." };
}

export async function liberarHolerites(competenciaId: string): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("folha_holerites")
    .update({ liberado_para_empregado: true })
    .eq("competencia_id", competenciaId);
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/folha/${competenciaId}`);
  return { status: "success", message: "Holerites liberados pros empregados." };
}

export async function marcarComoPaga(competenciaId: string): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  await supabase
    .from("folha_competencias")
    .update({ status: "paga" })
    .eq("id", competenciaId);
  revalidatePath(`/folha/${competenciaId}`);
  revalidatePath("/folha");
  return { status: "success", message: "Competência marcada como paga." };
}

// =====================
// PONTO
// =====================

export async function registrarBatida(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const empregadoId = String(formData.get("empregado_id") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const localId = String(formData.get("local_id") ?? "").trim() || null;
  const justificativa = String(formData.get("justificativa") ?? "").trim() || null;

  if (!empregadoId || !tipo) {
    return { status: "error", message: "Empregado e tipo obrigatórios." };
  }
  const supabase = await createClient();
  const agora = new Date();
  const { error } = await supabase.from("batidas_ponto").insert({
    tenant_id: session.tenantId,
    empregado_id: empregadoId,
    data: agora.toISOString().slice(0, 10),
    horario: agora.toISOString(),
    tipo,
    local_id: localId,
    metodo: "web",
    justificativa,
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath("/ponto");
  return { status: "success", message: "Batida registrada." };
}
