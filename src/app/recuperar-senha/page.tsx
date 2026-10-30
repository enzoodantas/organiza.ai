import { PageHeading } from "@/components/primitives";
import { PasswordRecoveryRequest } from "@/components/password-recovery-request";

export const metadata = { title: "Esqueci minha senha" };

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <><PageHeading eyebrow="ACESSO À CONTA" title="Esqueci minha senha" description="Solicite um link para definir uma nova senha." />
    <section className="panel max-w-lg">{erro === "link" && <p role="alert" className="form-error mb-4">O link expirou ou não pôde ser confirmado neste navegador. Solicite um novo link e abra-o no mesmo navegador.</p>}<PasswordRecoveryRequest /></section></>;
}
