import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Lê e escreve cookies de auth via next/headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll falha quando chamado em Server Component (read-only).
            // Tudo bem se o middleware estiver atualizando cookies em paralelo.
          }
        },
      },
    },
  );
}

/**
 * Cliente administrativo (service_role) — bypassa RLS.
 * USAR APENAS em jobs de servidor confiáveis: webhook handlers, seeds, migrations.
 * NUNCA expor ao cliente.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
