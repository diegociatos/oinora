"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialOnbState: FormState = { status: "idle" };

export async function criarOnboarding(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const empregadoId = String(formData.get("empregado_id") ?? "");
  const templateId = String(formData.get("template_id") ?? "");
  const mentorId = String(formData.get("mentor_id") ?? "").trim() || null;
  const dataInicio = String(formData.get("data_inicio") ?? "");

  if (!empregadoId || !templateId || !dataInicio) {
    return { status: "error", message: "Empregado, template e data obrigatórios." };
  }

  const supabase = await createClient();

  // Busca template + itens
  const { data: template } = await supabase
    .from("onboarding_templates")
    .select("duracao_dias")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return { status: "error", message: "Template não encontrado." };

  const { data: itensTpl } = await supabase
    .from("onboarding_template_itens")
    .select("id, titulo, descricao, dia_alvo, obrigatorio, categoria")
    .eq("template_id", templateId)
    .order("ordem");

  // Calcula data término
  const inicio = new Date(dataInicio);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + template.duracao_dias);

  // Cria onboarding_empregado
  const { data: onb, error } = await supabase
    .from("onboarding_empregado")
    .insert({
      tenant_id: session.tenantId,
      empregado_id: empregadoId,
      template_id: templateId,
      mentor_id: mentorId,
      data_inicio: dataInicio,
      data_termino_previsto: fim.toISOString().slice(0, 10),
      status: "em_curso",
      percentual_concluido: 0,
    })
    .select("id")
    .single();

  if (error) return { status: "error", message: error.message };

  // Clona itens do template em checklist
  if (itensTpl && itensTpl.length > 0) {
    const checklist = itensTpl.map((it) => {
      const dataAlvo = new Date(inicio);
      if (it.dia_alvo) dataAlvo.setDate(dataAlvo.getDate() + it.dia_alvo);
      return {
        tenant_id: session.tenantId,
        onboarding_id: onb.id,
        template_item_id: it.id,
        titulo: it.titulo,
        descricao: it.descricao,
        dia_alvo: it.dia_alvo,
        data_alvo: dataAlvo.toISOString().slice(0, 10),
        concluido: false,
      };
    });
    await supabase.from("onboarding_checklist").insert(checklist);
  }

  revalidatePath("/onboarding");
  redirect(`/onboarding/${onb.id}`);
}
