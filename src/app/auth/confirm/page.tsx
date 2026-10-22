import { PageHeading } from "@/components/primitives";
import { ConfirmInvitationForm } from "@/components/confirm-invitation-form";

export const metadata = { title: "Confirmar acesso" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash: tokenHash, type } = await searchParams;
  const valid = !!tokenHash && (type === "invite" || type === "recovery");

  return <>
    <PageHeading eyebrow="ACESSO AO NOSSO FUTURO" title="Confirme seu acesso." description="Depois da confirmação, você poderá definir sua senha." />
    <section className="panel max-w-lg">
      {valid ? <ConfirmInvitationForm tokenHash={tokenHash} type={type} /> : <>
        <h2>Link inválido</h2>
        <p className="muted mt-3">Abra o link completo do convite ou da recuperação, ou solicite um novo.</p>
      </>}
    </section>
  </>;
}
