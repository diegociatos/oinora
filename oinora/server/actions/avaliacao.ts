"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export async function calibrar9Box(
  empregadoId: string,
  desempenho: number | null,
  potencial: number | null,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops", "gestor"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  if (
    desempenho !== null &&
    (Number.isNaN(desempenho) || desempenho < 1 || desempenho > 3)
  ) {
    return { status: "error", message: "Desempenho deve ser 1, 2 ou 3." };
  }
  if (
    potencial !== null &&
    (Number.isNaN(potencial) || potencial < 1 || potencial > 3)
  ) {
    return { status: "error", message: "Potencial deve ser 1, 2 ou 3." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("empregados")
    .update({
      nine_box_desempenho: desempenho,
      nine_box_potencial: potencial,
      atualizado_por: session.userId,
    })
    .eq("id", empregadoId);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/avaliacao");
  revalidatePath(`/empregados/${empregadoId}`);
  return { status: "success", message: "9-Box calibrado." };
}

export async function criarCicloAvaliacao(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const nome = String(formData.get("nome") ?? "").trim();
  const ano = parseInt(String(formData.get("ano") ?? ""), 10);
  const trimestre = parseInt(String(formData.get("trimestre") ?? "0"), 10) || null;
  const dataInicio = String(formData.get("data_inicio") ?? "");
  const dataFim = String(formData.get("data_fim") ?? "");

  if (!nome || !ano || !dataInicio || !dataFim) {
    return { status: "error", message: "Preencha todos os campos obrigatórios." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("ciclos_avaliacao").insert({
    tenant_id: session.tenantId,
    nome,
    ano,
    trimestre,
    data_inicio: dataInicio,
    data_fim: dataFim,
    status: "em_curso",
  });
  if (error) return { status: "error", message: error.message };
  revalidatePath("/avaliacao");
  return { status: "success", message: "Ciclo criado." };
}
