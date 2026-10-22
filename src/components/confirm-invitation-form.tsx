"use client";

import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

export function ConfirmInvitationForm({ tokenHash, type }: {
  tokenHash: string;
  type: "invite" | "recovery";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const { error: verificationError } = await browserClient().auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (verificationError) {
        setError("Este link já foi usado ou expirou. Solicite um novo link.");
        return;
      }
      window.location.replace(type === "recovery" ? "/nova-senha" : "/convite");
    } catch {
      setError("Não foi possível conectar ao serviço de autenticação.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <h2>{type === "recovery" ? "Recuperar senha" : "Definir acesso"}</h2>
    <p className="muted mt-3">Confirme este link para {type === "recovery" ? "trocar sua senha" : "criar sua senha"}. Abrir a página não consome o link.</p>
    <form className="form-stack" onSubmit={confirm}>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button disabled={pending}>{pending ? "Confirmando…" : "Confirmar acesso"}</Button>
    </form>
  </>;
}
