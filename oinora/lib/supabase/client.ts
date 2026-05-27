"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components (browser).
 * Use SOMENTE para chamadas que precisam rodar no cliente (subscribe, realtime, etc.).
 * Para a maioria dos casos, prefira o cliente em ./server.ts dentro de Server Actions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
