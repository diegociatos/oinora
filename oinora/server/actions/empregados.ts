"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  empregadoFormSchema,
  type EmpregadoFormInput,
} from "@/lib/validators/empregado";

export type FormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
    }
  | { status: "success"; message: string; id?: string };

const initial: FormState = { status: "idle" };

function parseForm(formData: FormData): {
  ok: true;
  data: EmpregadoFormInput;
} | {
  ok: false;
  fieldErrors: Record<string, string>;
} {
  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }
  const result = empregadoFormSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  return { ok: true, data: result.data };
}

export async function criarEmpregado(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return {
      status: "error",
      message: "Você não tem permissão para criar empregados.",
    };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Há erros no formulário. Confira os campos destacados.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empregados")
    .insert({
      ...parsed.data,
      tenant_id: session.tenantId,
      atualizado_por: session.userId,
    })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Já existe empregado com este CPF ou matrícula."
          : `Erro: ${error.message}`,
    };
  }

  // Movimentação automática de admissão
  await supabase.from("empregado_movimentacoes").insert({
    empregado_id: data.id,
    tenant_id: session.tenantId,
    tipo: "admissao",
    data_efetiva: parsed.data.data_admissao,
    cargo_novo_id: parsed.data.cargo_id,
    departamento_novo_id: parsed.data.departamento_id,
    centro_custo_novo_id: parsed.data.centro_custo_id,
    salario_novo_centavos: parsed.data.salario_centavos,
    observacao: "Admissão registrada via cadastro de empregado.",
    aprovado_por: session.userId,
  });

  revalidatePath("/empregados");
  redirect(`/empregados/${data.id}`);
}

export async function atualizarEmpregado(
  empregadoId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return {
      status: "error",
      message: "Você não tem permissão para editar empregados.",
    };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Há erros no formulário. Confira os campos destacados.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();

  // Pega versão anterior pra detectar mudanças que merecem movimentação
  const { data: anterior } = await supabase
    .from("empregados")
    .select(
      "cargo_id, departamento_id, centro_custo_id, salario_centavos, status",
    )
    .eq("id", empregadoId)
    .single();

  const { error } = await supabase
    .from("empregados")
    .update({
      ...parsed.data,
      atualizado_por: session.userId,
    })
    .eq("id", empregadoId);

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Conflito: CPF ou matrícula já em uso."
          : `Erro: ${error.message}`,
    };
  }

  // Auto-registra movimentações relevantes
  if (anterior) {
    const movs: Array<Record<string, unknown>> = [];
    const hoje = new Date().toISOString().slice(0, 10);

    if (anterior.cargo_id !== parsed.data.cargo_id) {
      movs.push({
        empregado_id: empregadoId,
        tenant_id: session.tenantId,
        tipo: "mudanca_cargo",
        data_efetiva: hoje,
        cargo_anterior_id: anterior.cargo_id,
        cargo_novo_id: parsed.data.cargo_id,
        aprovado_por: session.userId,
        observacao: "Alteração de cargo via edição.",
      });
    }
    if (anterior.departamento_id !== parsed.data.departamento_id) {
      movs.push({
        empregado_id: empregadoId,
        tenant_id: session.tenantId,
        tipo: "transferencia",
        data_efetiva: hoje,
        departamento_anterior_id: anterior.departamento_id,
        departamento_novo_id: parsed.data.departamento_id,
        aprovado_por: session.userId,
        observacao: "Transferência de departamento via edição.",
      });
    }
    if (anterior.salario_centavos !== parsed.data.salario_centavos) {
      movs.push({
        empregado_id: empregadoId,
        tenant_id: session.tenantId,
        tipo: "reajuste",
        data_efetiva: hoje,
        salario_anterior_centavos: anterior.salario_centavos,
        salario_novo_centavos: parsed.data.salario_centavos,
        aprovado_por: session.userId,
        observacao: "Reajuste registrado via edição.",
      });
    }
    if (movs.length > 0) {
      await supabase.from("empregado_movimentacoes").insert(movs);
    }
  }

  revalidatePath("/empregados");
  revalidatePath(`/empregados/${empregadoId}`);
  redirect(`/empregados/${empregadoId}`);
}

export async function desligarEmpregado(
  empregadoId: string,
  dataDesligamento: string,
  motivo: string,
): Promise<FormState> {
  const session = await requireSession();
  if (!["owner", "admin", "hr_ops"].includes(session.role)) {
    return {
      status: "error",
      message: "Você não tem permissão para desligar empregados.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("empregados")
    .update({
      status: "desligado",
      data_desligamento: dataDesligamento,
      motivo_desligamento: motivo,
      atualizado_por: session.userId,
    })
    .eq("id", empregadoId);

  if (error) {
    return { status: "error", message: error.message };
  }

  await supabase.from("empregado_movimentacoes").insert({
    empregado_id: empregadoId,
    tenant_id: session.tenantId,
    tipo: "desligamento",
    data_efetiva: dataDesligamento,
    observacao: motivo,
    aprovado_por: session.userId,
  });

  revalidatePath("/empregados");
  revalidatePath(`/empregados/${empregadoId}`);
  return { status: "success", message: "Empregado desligado." };
}

export { initial as initialEmpregadoFormState };
