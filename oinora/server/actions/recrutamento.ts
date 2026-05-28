"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

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
