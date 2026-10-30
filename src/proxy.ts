import type { AppDatabase } from "@/lib/supabase/types";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
  const privateApp = process.env.APP_PRIVATE === "true";
  const config = supabaseConfig();
  if (!config) return privateApp
    ? new NextResponse("O acesso está sendo configurado. Tente novamente em alguns minutos.", {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    })
    : NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<AppDatabase>(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(items) {
      items.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    }
  } });
  const { data } = await supabase.auth.getClaims();
  const publicPaths = ["/entrar", "/recuperar-senha", "/convite", "/nova-senha", "/auth/confirm", "/auth/callback"];
  if (privateApp && !data?.claims && !publicPaths.includes(request.nextUrl.pathname)) {
    const destination = new URL("/entrar", request.url);
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    response = redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
export const config = { matcher: ["/", "/financas", "/desafios", "/planejamento", "/perfil", "/mascotes", "/recuperar-senha", "/entrar", "/convite", "/nova-senha", "/conta/:path*", "/auth/:path*"] };
