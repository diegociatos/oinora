"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./empregados";

export const initialFormState: FormState = { status: "idle" };

function ensureAdmin(role: string): boolean {
  return ["owner", "admin", "hr_ops"].includes(role);
}

function parse<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; fieldErrors: Record<string, string> } {
  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of r.error.issues) {
      const p = i.path.join(".");
      if (p && !fieldErrors[p]) fieldErrors[p] = i.message;
    }
    return { ok: false, fieldErrors };
  }
  return { ok: true, data: r.data };
}

const optionalString = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalNumber = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v === "" ? null : Number(v)))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(v), "Número inválido");

// =================================================
// DEPARTAMENTOS
// =================================================
const departamentoSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto"),
  sigla: optionalString,
  parent_id: optionalString,
});

export async function salvarDepartamento(
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!ensureAdmin(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const parsed = parse(departamentoSchema, formData);
  if (!parsed.ok) {
    return { status: "error", message: "Confira os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("departamentos")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { status: "error", message: error.message };
  } else {
    const { error } = await supabase
      .from("departamentos")
      .insert({ ...parsed.data, tenant_id: session.tenantId });
    if (error) return { status: "error", message: error.message };
  }
  revalidatePath("/configuracoes/departamentos");
  redirect("/configuracoes/departamentos");
}

export async function deletarDepartamento(id: string): Promise<FormState> {
  const session = await requireSession();
  if (session.role !== "owner") {
    return { status: "error", message: "Apenas owner pode deletar." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("departamentos").delete().eq("id", id);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23503"
          ? "Departamento em uso por empregados ou cargos — remova vínculos antes."
          : error.message,
    };
  }
  revalidatePath("/configuracoes/departamentos");
  return { status: "success", message: "Departamento removido." };
}

// =================================================
// CARGOS
// =================================================
const cargoSchema = z.object({
  codigo: z.string().trim().min(2, "Código muito curto"),
  nome: z.string().trim().min(2, "Nome muito curto"),
  cbo: optionalString,
  nivel: optionalString,
  departamento_id: z.string().uuid().or(z.literal("")).transform((v) => v === "" ? null : v).nullable(),
  faixa_salarial_min_centavos: optionalNumber,
  faixa_salarial_max_centavos: optionalNumber,
  jornada_horas_semana: optionalNumber,
});

export async function salvarCargo(
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!ensureAdmin(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const parsed = parse(cargoSchema, formData);
  if (!parsed.ok) {
    return { status: "error", message: "Confira os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("cargos").update(parsed.data).eq("id", id);
    if (error) return { status: "error", message: error.message };
  } else {
    const { error } = await supabase
      .from("cargos")
      .insert({ ...parsed.data, tenant_id: session.tenantId });
    if (error) {
      return {
        status: "error",
        message: error.code === "23505" ? "Código de cargo já existe." : error.message,
      };
    }
  }
  revalidatePath("/configuracoes/cargos");
  redirect("/configuracoes/cargos");
}

export async function deletarCargo(id: string): Promise<FormState> {
  const session = await requireSession();
  if (session.role !== "owner") {
    return { status: "error", message: "Apenas owner pode deletar." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("cargos").delete().eq("id", id);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23503"
          ? "Cargo em uso por empregados — remova vínculos antes."
          : error.message,
    };
  }
  revalidatePath("/configuracoes/cargos");
  return { status: "success", message: "Cargo removido." };
}

// =================================================
// CENTROS DE CUSTO
// =================================================
const centroCustoSchema = z.object({
  codigo: z.string().trim().min(2, "Código muito curto"),
  nome: z.string().trim().min(2, "Nome muito curto"),
  departamento_id: z
    .string()
    .uuid()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export async function salvarCentroCusto(
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!ensureAdmin(session.role)) {
    return { status: "error", message: "Sem permissão." };
  }
  const parsed = parse(centroCustoSchema, formData);
  if (!parsed.ok) {
    return { status: "error", message: "Confira os campos.", fieldErrors: parsed.fieldErrors };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("centros_custo")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { status: "error", message: error.message };
  } else {
    const { error } = await supabase
      .from("centros_custo")
      .insert({ ...parsed.data, tenant_id: session.tenantId });
    if (error) {
      return {
        status: "error",
        message: error.code === "23505" ? "Código de centro já existe." : error.message,
      };
    }
  }
  revalidatePath("/configuracoes/centros-custo");
  redirect("/configuracoes/centros-custo");
}

export async function deletarCentroCusto(id: string): Promise<FormState> {
  const session = await requireSession();
  if (session.role !== "owner") {
    return { status: "error", message: "Apenas owner pode deletar." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("centros_custo").delete().eq("id", id);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23503"
          ? "Centro de custo em uso — remova vínculos antes."
          : error.message,
    };
  }
  revalidatePath("/configuracoes/centros-custo");
  return { status: "success", message: "Centro de custo removido." };
}
