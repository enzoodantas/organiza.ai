import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : url.origin;
  const code = url.searchParams.get("code");
  const supabase = await serverClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = url.searchParams.get("next") === "/nova-senha" ? "/nova-senha" : "/conta";
      return NextResponse.redirect(new URL(next, origin), {
        headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
      });
    }
  }
  return NextResponse.redirect(new URL("/recuperar-senha?erro=link", origin), {
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
