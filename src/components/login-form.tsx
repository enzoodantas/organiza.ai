"use client";
import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import Link from "next/link";
export function LoginForm() {
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError(""); const data = new FormData(e.currentTarget);
    try {
      const { error } = await browserClient().auth.signInWithPassword({ email: String(data.get("email")).trim(), password: String(data.get("password")) });
      if (error) { setError("O Auth recusou este e-mail ou senha. Confira o endereço da conta local ou use ‘Esqueci minha senha’."); return; }
      window.location.replace("/conta");
    } catch { setError("Não foi possível conectar ao serviço de autenticação."); }
    finally { setPending(false); }
  }
  return <form className="form-stack" onSubmit={submit}><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label><Link href="/recuperar-senha">Esqueci minha senha</Link>{error && <p role="alert" className="form-error">{error}</p>}<Button disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button></form>;
}
