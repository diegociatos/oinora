"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type InviteState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
    }
  | {
      status: "success";
      message: string;
      magicLink?: string;
      senhaTemporaria?: string;
      email?: string;
    };

export const initialInviteState: InviteState = { status: "idle" };

const inviteSchema = z.object({
  email: z.email("Email inválido"),
  nome_completo: z.string().trim().min(3, "Nome muito curto"),
  role: z.enum([
    "owner",
    "admin",
    "gestor",
    "hr_ops",
    "empregado",
    "advogado_interno",
  ]),
  empregado_id: z
    .string()
    .uuid()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

function randomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_.@!#";
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function convidarMembro(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await requireSession();
  if (!["owner", "admin"].includes(session.role)) {
    return {
      status: "error",
      message: "Apenas owner e admin podem convidar membros.",
    };
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const p = i.path.join(".");
      if (p && !fieldErrors[p]) fieldErrors[p] = i.message;
    }
    return {
      status: "error",
      message: "Confira os campos.",
      fieldErrors,
    };
  }

  const { email, nome_completo, role, empregado_id } = parsed.data;
  const admin = createAdminClient();
  const supabase = await createClient();

  // 1. Tenta criar o user (pode já existir se outro tenant convidou antes)
  const senhaTemporaria = randomPassword();
  const { data: createData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { nome_completo },
    });

  let userId: string;
  if (createError) {
    if (createError.message?.toLowerCase().includes("already")) {
      // Usuário já existe — busca o id
      const { data: existing } = await admin
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!existing?.id) {
        return {
          status: "error",
          message:
            "Usuário já existe mas não foi possível obter o id. Tente outro email.",
        };
      }
      userId = existing.id;
    } else {
      return { status: "error", message: createError.message };
    }
  } else {
    userId = createData.user.id;
  }

  // 2. Cria tenant_membership (idempotente via ON CONFLICT)
  const { error: memError } = await admin.from("tenant_memberships").upsert(
    {
      usuario_id: userId,
      tenant_id: session.tenantId,
      role,
      ativo: true,
    },
    { onConflict: "usuario_id,tenant_id,role", ignoreDuplicates: true },
  );
  if (memError) {
    return {
      status: "error",
      message: `Membership: ${memError.message}`,
    };
  }

  // 3. Vincula a um empregado existente, se selecionado
  if (empregado_id) {
    await admin
      .from("empregados")
      .update({ usuario_id: userId })
      .eq("id", empregado_id)
      .eq("tenant_id", session.tenantId);
  }

  // 4. Gera magic link para o convite
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/empregados`,
    },
  });

  revalidatePath("/usuarios");

  return {
    status: "success",
    message: `Convite criado para ${email}.`,
    email,
    senhaTemporaria,
    magicLink: linkData?.properties?.action_link,
  };
}

export async function suspenderMembro(
  membershipId: string,
): Promise<InviteState> {
  const session = await requireSession();
  if (session.role !== "owner") {
    return { status: "error", message: "Apenas owner pode suspender." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .update({ ativo: false })
    .eq("id", membershipId);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/usuarios");
  return { status: "success", message: "Membro suspenso." };
}

export async function reativarMembro(
  membershipId: string,
): Promise<InviteState> {
  const session = await requireSession();
  if (session.role !== "owner") {
    return { status: "error", message: "Apenas owner pode reativar." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .update({ ativo: true })
    .eq("id", membershipId);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/usuarios");
  return { status: "success", message: "Membro reativado." };
}
