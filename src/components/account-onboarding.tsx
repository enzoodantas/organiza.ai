"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

type Invitation = {
  id: string;
  direction: "received" | "sent";
  relationship_name: string;
  other_name: string;
  expires_at: string;
};

type Props = {
  email: string;
  profile: { display_name: string; mascot: string } | null;
  relationship: { id: string; name: string } | null;
  members: { user_id: string; profiles: { display_name: string } | null }[];
  invitations: Invitation[];
};

export function AccountOnboarding({ email, profile, relationship, members, invitations }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function callRpc(name: string, parameters: Record<string, string>) {
    setPending(true);
    setError("");
    try {
      const { error: rpcError } = await browserClient().rpc(name, parameters);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao banco. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void callRpc("create_profile", {
      profile_name: String(data.get("profile_name") ?? ""),
      chosen_mascot: String(data.get("chosen_mascot") ?? ""),
    });
  }

  function submitRelationship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void callRpc("create_relationship", { relationship_name: String(data.get("relationship_name") ?? "") });
  }

  function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void callRpc("invite_partner", { partner_email: String(data.get("partner_email") ?? "") });
  }

  const received = invitations.filter((item) => item.direction === "received");
  const sent = invitations.filter((item) => item.direction === "sent");

  return <div className="mt-6">
    <p className="muted">Conectado como {email}.</p>
    {!profile ? <>
      <h2 className="mt-6">Crie seu perfil</h2>
      <p className="muted mt-3">Escolha o nome exibido e seu mascote. Cada pessoa cria o próprio perfil.</p>
      <form className="form-stack" onSubmit={submitProfile}>
        <label>Seu nome<input name="profile_name" maxLength={80} required autoComplete="name" /></label>
        <label>Seu mascote<select name="chosen_mascot" defaultValue="cat"><option value="cat">Gato</option><option value="dog">Cachorro</option></select></label>
        <Button disabled={pending}>{pending ? "Salvando…" : "Criar meu perfil"}</Button>
      </form>
    </> : <>
      <p className="mt-3"><strong>{profile.display_name}</strong> · mascote: {profile.mascot === "dog" ? "cachorro" : "gato"}</p>
      {received.map((invitation) => <div key={invitation.id} className="mt-6 rounded-xl border border-border p-5">
        <h2>Convite de {invitation.other_name}</h2>
        <p className="muted mt-3">Você foi convidado para “{invitation.relationship_name}”. Aceite apenas se deseja compartilhar este espaço financeiro com essa pessoa.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={pending} onClick={() => void callRpc("accept_relationship_invitation", { invitation_id: invitation.id })}>Aceitar vínculo</Button>
          <Button variant="outline" disabled={pending} onClick={() => void callRpc("decline_relationship_invitation", { invitation_id: invitation.id })}>Recusar</Button>
        </div>
      </div>)}
      {relationship ? <>
        <h2 className="mt-7">{relationship.name}</h2>
        <p className="muted mt-3">Pessoas vinculadas: {members.map((member) => member.profiles?.display_name ?? "Participante").join(" e ")}.</p>
        {members.length === 1 && sent.length > 0 && <p className="muted mt-4">Convite enviado. O vínculo ficará completo quando a outra pessoa aceitar na própria conta.</p>}
        {members.length === 1 && sent.length === 0 && <>
          <p className="muted mt-4">Convide a pessoa que compartilhará este espaço com você. Ela precisará aceitar na própria conta.</p>
          <form className="form-stack" onSubmit={submitInvitation}>
            <label>E-mail da outra pessoa<input name="partner_email" type="email" autoComplete="email" required /></label>
            <Button disabled={pending}>{pending ? "Enviando…" : "Convidar para o vínculo"}</Button>
          </form>
        </>}
        {members.length === 2 && <p className="form-success mt-4">Vínculo confirmado pelas duas contas.</p>}
      </> : received.length === 0 ? <>
        <h2 className="mt-7">Criar espaço do casal</h2>
        <p className="muted mt-3">Crie o espaço e depois convide a outra pessoa. Nenhum dado financeiro será compartilhado antes do aceite.</p>
        <form className="form-stack" onSubmit={submitRelationship}>
          <label>Nome do espaço<input name="relationship_name" defaultValue="Nosso Futuro" maxLength={100} required /></label>
          <Button disabled={pending}>{pending ? "Criando…" : "Criar espaço"}</Button>
        </form>
      </> : null}
    </>}
    {error && <p role="alert" className="form-error mt-5">{error}</p>}
  </div>;
}
