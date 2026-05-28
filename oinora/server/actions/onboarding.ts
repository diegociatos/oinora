"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export async function toggleChecklistItem(
  itemId: string,
  onboardingId: string,
  concluido: boolean,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops", "gestor"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_checklist")
    .update({
      concluido,
      concluido_em: concluido ? new Date().toISOString() : null,
      concluido_por: concluido ? session.userId : null,
    })
    .eq("id", itemId);
  if (error) return { status: "error", message: error.message };

  // Recalcula percentual
  const { data: itens } = await supabase
    .from("onboarding_checklist")
    .select("concluido")
    .eq("onboarding_id", onboardingId);

  if (itens && itens.length > 0) {
    const total = itens.length;
    const done = itens.filter((i) => i.concluido).length;
    const pct = Math.round((done / total) * 100);
    await supabase
      .from("onboarding_empregado")
      .update({
        percentual_concluido: pct,
        status: pct === 100 ? "concluido" : "em_curso",
      })
      .eq("id", onboardingId);
  }

  revalidatePath(`/onboarding/${onboardingId}`);
  revalidatePath("/onboarding");
  return { status: "success", message: "Item atualizado." };
}
