import { ProfileView } from "@/components/profile-view";
import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
export const metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const client = await serverClient();
  const { data } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!data.user) return <ProfileView />;
  return <section className="panel"><h1>Seu espaço, seu ritmo.</h1><p className="muted mt-3">Cuide do seu perfil e acompanhe as pequenas conquistas da jornada.</p><div className="form-stack mt-6"><Link className="underline" href="/conta">Minha conta e vínculo</Link><Link className="underline" href="/mascotes">Meu mascote e guarda-roupa</Link><Link className="underline" href="/planejamento">Nosso planejamento</Link></div></section>;
}
