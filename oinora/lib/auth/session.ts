import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionContext = {
  userId: string;
  email: string;
  nomeCompleto: string;
  tenantId: string;
  tenantNome: string;
  role:
    | "super_admin"
    | "recrutador_oinora"
    | "owner"
    | "admin"
    | "gestor"
    | "hr_ops"
    | "empregado"
    | "candidato"
    | "advogado_externo"
    | "advogado_interno";
};

/**
 * Carrega contexto de sessão para rotas autenticadas.
 * Redireciona se não houver usuário OU se ele não tiver membership ativa.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome_completo")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role, tenant:tenants(id, nome_fantasia, razao_social)")
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.tenant) {
    redirect("/sem-acesso");
  }

  const tenant = Array.isArray(membership.tenant)
    ? membership.tenant[0]
    : membership.tenant;

  return {
    userId: user.id,
    email: user.email ?? "",
    nomeCompleto: usuario?.nome_completo ?? user.email ?? "",
    tenantId: tenant.id,
    tenantNome: tenant.nome_fantasia || tenant.razao_social,
    role: membership.role,
  };
}
