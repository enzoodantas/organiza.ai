"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { isLocalSupabase } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";

export function PasswordRecoveryRequest() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    try {
      const { error: requestError } = await browserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
      });
      if (requestError) { setError("Não foi possível solicitar o link agora. Aguarde um minuto e tente novamente."); return; }
      setSent(true);
    } catch { setError("Não foi possível conectar ao serviço de autenticação."); }
    finally { setPending(false); }
  }

  return <><h2>Recuperar acesso</h2>
    {sent ? <p role="status" className="muted mt-3">{isLocalSupabase() ? <>Se este e-mail tiver uma conta, o link foi enviado ao Mailpit local. Abra <a href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">a caixa de e-mails local</a> neste computador e confirme o link para criar uma nova senha.</> : <>Se este e-mail tiver uma conta, você receberá um link para criar uma nova senha. Confira sua caixa de entrada e a pasta de spam.</>}</p>
      : <form className="form-stack" onSubmit={submit}><label>E-mail da conta<input name="email" type="email" autoComplete="email" required /></label>
        {error && <p role="alert" className="form-error">{error}</p>}<Button disabled={pending}>{pending ? "Enviando…" : "Enviar link de recuperação"}</Button></form>}
    <p className="muted mt-6"><Link href="/entrar">Voltar para entrar</Link></p>
  </>;
}
