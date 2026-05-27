"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; message: string };

function fieldErrorFromMissing(
  fields: Record<string, string | undefined>,
): Record<string, string> | undefined {
  const errors: Record<string, string> = {};
  for (const [name, value] of Object.entries(fields)) {
    if (!value?.trim()) {
      errors[name] = "Campo obrigatório";
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

export async function entrarComSenha(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors = fieldErrorFromMissing({ email, password });
  if (fieldErrors) {
    return { status: "error", message: "Preencha email e senha.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message:
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/empregados");
}

export async function entrarComMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return {
      status: "error",
      message: "Informe seu email.",
      fieldErrors: { email: "Campo obrigatório" },
    };
  }

  const supabase = await createClient();
  const origin = String(formData.get("origin") ?? "");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/empregados`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message:
      "Enviamos um link para o seu email. Clique para entrar — válido por 15 minutos.",
  };
}

export async function cadastrar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nomeCompleto = String(formData.get("nome_completo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fieldErrors = fieldErrorFromMissing({
    nome_completo: nomeCompleto,
    email,
    password,
  });
  if (fieldErrors) {
    return {
      status: "error",
      message: "Preencha todos os campos.",
      fieldErrors,
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Senha precisa de ao menos 8 caracteres.",
      fieldErrors: { password: "Mínimo 8 caracteres" },
    };
  }

  const supabase = await createClient();
  const origin = String(formData.get("origin") ?? "");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome_completo: nomeCompleto },
      emailRedirectTo: `${origin}/auth/callback?next=/empregados`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message:
      "Cadastro recebido. Verifique seu email para confirmar e entrar na plataforma.",
  };
}

export async function recuperarSenha(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { status: "error", message: "Informe seu email." };
  }

  const supabase = await createClient();
  const origin = String(formData.get("origin") ?? "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message:
      "Se o email existir na nossa base, você receberá um link para criar uma nova senha.",
  };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
