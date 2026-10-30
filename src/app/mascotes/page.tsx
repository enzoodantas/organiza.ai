import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { MascotWardrobe } from "@/components/mascot-wardrobe";
import { PageHeading } from "@/components/primitives";
import { serverClient } from "@/lib/supabase/server";
import { loadMascotPeople } from "@/lib/mascots";

export const metadata = { title: "Mascotes" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const client = await serverClient();
  const { data: auth } = client ? await client.auth.getUser() : { data: { user: null } };
  const heading = <PageHeading eyebrow="COMPANHIA PARA A JORNADA" title="Bons hábitos fazem crescer." description="Um companheiro, um cuidado por semana e pequenas conquistas para vestir." />;
  if (!client || !auth.user) return <>{heading}<div className="mascot-cards">{(["cat", "dog"] as const).map(animal => <section className="panel mascot-profile" key={animal}><span className="small-tag">PRÉVIA DO GUARDA-ROUPA</span><Mascot animal={animal} items={animal === "cat" ? ["sweater_sage", "sun_hat"] : ["sweater_rose", "party_hat"]} /><h2>{animal === "cat" ? "Gato" : "Cachorro"}</h2><p className="muted mt-3">Escolha seu companheiro e vista as conquistas da sua jornada.</p></section>)}</div><section className="panel mt-6"><h2>Recompensar o cuidado, respeitar o ritmo.</h2><p className="muted mt-3">A revisão semanal rende moedas virtuais para roupas e chapéus. Sem dinheiro real, punição por pausas ou recompensas por gastar mais.</p><Link className="inline-block underline mt-4" href="/entrar">Entre para cuidar do seu mascote</Link></section></>;
  const membership = await client.from("relationship_members").select("relationship_id")
    .eq("user_id", auth.user.id).is("revoked_at", null).maybeSingle();
  if (membership.error) return <p className="form-error" role="alert">Não foi possível carregar seu espaço.</p>;
  if (!membership.data) return <>{heading}<section className="panel"><p>Conclua seu vínculo em <Link href="/conta" className="underline">Minha conta</Link> para cuidar do seu mascote.</p></section></>;
  const [people, catalog, inventory, wallet, review] = await Promise.all([
    loadMascotPeople(client),
    client.from("mascot_items").select("id,name,slot,price").order("price").order("id"),
    client.from("mascot_inventory").select("item_id,equipped").eq("user_id", auth.user.id),
    client.from("mascot_wallets").select("coins,xp").eq("user_id", auth.user.id).maybeSingle(),
    client.from("mascot_reviews").select("week_start").eq("user_id", auth.user.id).order("week_start", { ascending: false }).limit(1),
  ]);
  if (people.error || catalog.error || inventory.error || wallet.error || review.error)
    return <>{heading}<p role="alert" className="form-error">Não foi possível carregar o guarda-roupa. Atualize a página.</p></>;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const monday = new Date(`${today}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const reviewed = review.data?.[0]?.week_start === monday.toISOString().slice(0, 10);
  return <>{heading}<MascotWardrobe userId={auth.user.id} people={people.people} catalog={catalog.data ?? []}
    owned={inventory.data ?? []} coins={wallet.data?.coins ?? 0} xp={wallet.data?.xp ?? 0} reviewed={reviewed} /></>;
}
