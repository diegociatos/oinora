"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

/**
 * Exporta todos os dados pessoais do empregado logado em um JSON.
 * LGPD art. 18 inciso V (direito à portabilidade).
 */
export async function exportarMeusDados(): Promise<
  { ok: true; dados: Record<string, unknown> } | { ok: false; message: string }
> {
  const session = await requireSession();
  if (!session.empregadoId) {
    return { ok: false, message: "Empregado não encontrado." };
  }

  const supabase = await createClient();

  const [
    { data: empregado },
    { data: dependentes },
    { data: documentos },
    { data: movimentacoes },
    { data: holerites },
    { data: matriculas },
    { data: batidas },
  ] = await Promise.all([
    supabase.from("empregados").select("*").eq("id", session.empregadoId).single(),
    supabase.from("empregado_dependentes").select("*").eq("empregado_id", session.empregadoId),
    supabase.from("empregado_documentos").select("*").eq("empregado_id", session.empregadoId),
    supabase.from("empregado_movimentacoes").select("*").eq("empregado_id", session.empregadoId),
    supabase.from("folha_holerites").select("*").eq("empregado_id", session.empregadoId),
    supabase.from("empregado_curso_matriculas").select("*").eq("empregado_id", session.empregadoId),
    supabase.from("batidas_ponto").select("*").eq("empregado_id", session.empregadoId).limit(500),
  ]);

  return {
    ok: true,
    dados: {
      meta: {
        exportado_em: new Date().toISOString(),
        empregado_id: session.empregadoId,
        tenant_id: session.tenantId,
        artigo_lgpd: "Art. 18 inciso V (direito à portabilidade dos dados)",
      },
      empregado: empregado ?? {},
      dependentes: dependentes ?? [],
      documentos: documentos ?? [],
      movimentacoes: movimentacoes ?? [],
      holerites: holerites ?? [],
      cursos_matriculas: matriculas ?? [],
      batidas_ponto: batidas ?? [],
    },
  };
}

/**
 * Solicita exclusão dos dados pessoais.
 * Cria uma notificação pro RH; a exclusão de fato é feita manualmente
 * (porque exclusão de empregado tem implicações legais — eSocial S-2299).
 */
export async function solicitarExclusao(motivo: string): Promise<FormState> {
  const session = await requireSession();
  if (!session.empregadoId) {
    return { status: "error", message: "Empregado não encontrado." };
  }

  const admin = createAdminClient();

  // Busca o owner do tenant pra notificar
  const { data: owner } = await admin
    .from("tenant_memberships")
    .select("usuario_id")
    .eq("tenant_id", session.tenantId)
    .eq("role", "owner")
    .eq("ativo", true)
    .maybeSingle();

  if (owner) {
    await admin.from("notificacoes").insert({
      tenant_id: session.tenantId,
      usuario_id: owner.usuario_id,
      tipo: "lgpd_exclusao",
      titulo: `Solicitação de exclusão de dados (LGPD) · ${session.nomeCompleto}`,
      mensagem: `${session.nomeCompleto} (mat. ${session.empregadoMatricula}) solicitou a exclusão dos próprios dados pessoais.\n\nMotivo declarado: ${motivo || "(não informado)"}\n\nAvalie a solicitação conforme LGPD art. 18 inciso VI. Lembre-se: dados de folha e eSocial têm retenção legal mínima de 5 anos.`,
      link: `/empregados/${session.empregadoId}`,
    });
  }

  // Loga em audit_log também
  await admin.from("audit_log").insert({
    tenant_id: session.tenantId,
    usuario_id: session.userId,
    acao: "lgpd.solicitar_exclusao",
    recurso_tipo: "empregado",
    recurso_id: session.empregadoId,
    dados_depois: { motivo, solicitado_em: new Date().toISOString() },
  });

  revalidatePath("/meus-dados");
  return {
    status: "success",
    message:
      "Solicitação recebida. O responsável pelo seu tenant analisará e responderá em até 15 dias úteis (LGPD art. 19).",
  };
}
