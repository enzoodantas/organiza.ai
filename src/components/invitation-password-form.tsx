"use client";

import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export function InvitationPasswordForm({ email, recovery = false }: { email: string; recovery?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    if (password.length < 12) {
      setError("Escolha uma senha de pelo menos 12 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setPending(true);
    try {
      const supabase = browserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || sessionData.user?.email !== email) {
        setError("A sessão de acesso expirou. Solicite um novo link.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Não foi possível definir a senha. Escolha outra e tente novamente.");
        return;
      }
      window.location.replace("/conta");
    } catch {
      setError("Não foi possível conectar ao serviço de autenticação.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <h2>{recovery ? "Criar nova senha" : "Definir senha"}</h2>
    <p className="muted mt-3">Conta {email}. Use uma senha exclusiva para esta conta.</p>
    <form className="form-stack" onSubmit={submit}>
      <label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
      <label>Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button disabled={pending}>{pending ? "Salvando…" : recovery ? "Salvar nova senha" : "Definir senha e entrar"}</Button>
    </form>
  </>;
}
