import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza a sessão Supabase em cada request — chama-se do middleware.ts da raiz.
 * Renova access tokens próximos de expirar e mantém cookies sincronizados.
 *
 * Também é o ponto natural para redirecionar usuários não autenticados
 * fora de rotas protegidas. Por enquanto deixamos abertas as rotas públicas
 * mais comuns (/, /login, /signup, /recuperar-senha, /auth/*) e protegemos o resto.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: getUser() (não getSession) — valida o token contra o servidor Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/recuperar-senha") ||
    path.startsWith("/auth/");

  // Não-autenticado tentando acessar área protegida → /login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Autenticado tentando acessar /login ou /signup → redireciona ao dashboard
  if (
    user &&
    (path.startsWith("/login") ||
      path.startsWith("/signup") ||
      path.startsWith("/recuperar-senha"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/empregados";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
