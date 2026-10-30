import { ProfileView } from "@/components/profile-view";
import Link from "next/link";
import { serverClient } from "@/lib/supabase/server";
import { ProfilePhotoEditor } from "@/components/profile-photo-editor";
export const metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const client = await serverClient();
  const { data } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!data.user) return <ProfileView />;
  const [profile, photo] = await Promise.all([
    client!.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle(),
    client!.from("profile_photos").select("image_data").eq("user_id", data.user.id).maybeSingle(),
  ]);
  return <section className="panel"><h1>Seu espaço, seu ritmo.</h1><p className="muted mt-3">Cuide do seu perfil e acompanhe as pequenas conquistas da jornada.</p>
    {profile.error || photo.error ? <p role="alert" className="form-error mt-4">Não foi possível carregar seu perfil. Atualize a página.</p>
      : profile.data && <ProfilePhotoEditor name={profile.data.display_name} photo={photo.data?.image_data ?? null} />}
    <div className="form-stack mt-6"><Link className="underline" href="/conta">Minha conta e vínculo</Link><Link className="underline" href="/mascotes">Meu mascote e guarda-roupa</Link><Link className="underline" href="/planejamento">Nosso planejamento</Link></div></section>;
}
