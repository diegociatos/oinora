import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth/magic-link/recover.
 * Supabase envia o usuário pra cá com ?code=... ou ?token_hash=... + ?type=...
 * Trocamos pelo session JWT e seguimos pra `next` (default: /empregados).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/empregados";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "magiclink" | "recovery" | "signup" | "email_change",
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=Link%20inv%C3%A1lido`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
