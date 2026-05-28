"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialDependenteState: FormState = { status: "idle" };

const dependenteSchema = z.object({
  nome_completo: z.string().trim().min(2, "Nome muito curto"),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || v.length === 11,
      "CPF deve ter 11 dígitos",
    ),
  data_nascimento: z.string().min(1, "Data obrigatória"),
  parentesco: z.string().trim().min(2, "Parentesco obrigatório"),
  ir_dependente: z.string().transform((v) => v === "on" || v === "true"),
  salario_familia: z.string().transform((v) => v === "on" || v === "true"),
  plano_saude: z.string().transform((v) => v === "on" || v === "true"),
});

function parse(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  // Checkboxes nao incluidas no FormData quando desmarcadas
  for (const ck of ["ir_dependente", "salario_familia", "plano_saude"]) {
    if (!(ck in raw)) raw[ck] = "";
  }
  const r = dependenteSchema.safeParse(raw);
  if (!r.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of r.error.issues) {
      const p = i.path.join(".");
      if (p && !fieldErrors[p]) fieldErrors[p] = i.message;
    }
    return { ok: false as const, fieldErrors };
  }
  return { ok: true as const, data: r.data };
}

export async function salvarDependente(
  empregadoId: string,
  dependenteId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const p = parse(formData);
  if (!p.ok) {
    return {
      status: "error",
      message: "Confira os campos.",
      fieldErrors: p.fieldErrors,
    };
  }

  const supabase = await createClient();
  if (dependenteId) {
    const { error } = await supabase
      .from("empregado_dependentes")
      .update(p.data)
      .eq("id", dependenteId);
    if (error) return { status: "error", message: error.message };
  } else {
    const { error } = await supabase.from("empregado_dependentes").insert({
      ...p.data,
      empregado_id: empregadoId,
      tenant_id: session.tenantId,
    });
    if (error) return { status: "error", message: error.message };
  }

  revalidatePath(`/empregados/${empregadoId}`);
  return { status: "success", message: "Dependente salvo." };
}

export async function removerDependente(
  empregadoId: string,
  dependenteId: string,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("empregado_dependentes")
    .delete()
    .eq("id", dependenteId);
  if (error) return { status: "error", message: error.message };
  revalidatePath(`/empregados/${empregadoId}`);
  return { status: "success", message: "Dependente removido." };
}
