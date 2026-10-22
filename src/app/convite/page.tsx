import { PageHeading } from "@/components/primitives";
import { InvitationPasswordForm } from "@/components/invitation-password-form";
import { serverClient } from "@/lib/supabase/server";

export const metadata = { title: "Aceitar convite" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await serverClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return <>
    <PageHeading eyebrow="CONVITE PARA O NOSSO FUTURO" title="Sua conta começa aqui." description="Defina sua senha para entrar no espaço do casal." />
    <section className="panel max-w-lg">
      {data.user ? <InvitationPasswordForm email={data.user.email ?? ""} /> : <>
        <h2>Convite indisponível</h2>
        <p className="muted mt-3">Abra o link de acesso neste mesmo navegador e confirme antes de definir sua senha.</p>
      </>}
    </section>
  </>;
}
