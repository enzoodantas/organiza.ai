import { PageHeading } from "@/components/primitives";
import { InvitationPasswordForm } from "@/components/invitation-password-form";
import { serverClient } from "@/lib/supabase/server";

export const metadata = { title: "Nova senha" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await serverClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return <><PageHeading eyebrow="ACESSO À CONTA" title="Criar nova senha" description="Escolha uma senha para a conta confirmada." />
    <section className="panel max-w-lg">{data.user ? <InvitationPasswordForm email={data.user.email ?? ""} recovery />
      : <p className="muted">Abra e confirme primeiro o link enviado à caixa de e-mails local.</p>}</section></>;
}
