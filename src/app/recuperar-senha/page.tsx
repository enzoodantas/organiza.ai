import { PageHeading } from "@/components/primitives";
import { PasswordRecoveryRequest } from "@/components/password-recovery-request";

export const metadata = { title: "Esqueci minha senha" };

export default function Page() {
  return <><PageHeading eyebrow="ACESSO À CONTA" title="Esqueci minha senha" description="Solicite um link para definir uma nova senha." />
    <section className="panel max-w-lg"><PasswordRecoveryRequest /></section></>;
}
