"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError(""); const data = new FormData(e.currentTarget);
    try {
      const { error } = await browserClient().auth.signInWithPassword({ email: String(data.get("email")), password: String(data.get("password")) });
      if (error) { setError("Não foi possível entrar. Verifique seus dados e tente novamente."); return; }
      router.push("/conta"); router.refresh();
    } catch { setError("Não foi possível conectar ao serviço de autenticação."); }
    finally { setPending(false); }
  }
  return <form className="form-stack" onSubmit={submit}><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p role="alert" className="form-error">{error}</p>}<Button disabled={pending}>{pending ? "Entrando…" : "Entrar com Supabase"}</Button></form>;
}
