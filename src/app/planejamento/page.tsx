import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { MonthlyPlanner, type PlanItem } from "@/components/monthly-planner";

export const metadata = { title: "Planejamento mensal" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await serverClient();
  if (!supabase) redirect("/entrar");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/entrar");
  const { data: membership, error: memberError } = await supabase.from("relationship_members")
    .select("relationship_id").eq("user_id", auth.user.id).is("revoked_at", null).maybeSingle();
  if (memberError) return <p role="alert" className="form-error">Não foi possível carregar seu espaço.</p>;
  if (!membership) return <section className="panel"><h1>Planejamento mensal</h1><p className="muted mt-3">Conclua o vínculo do casal em <a href="/conta">Minha conta</a> para ver as estimativas.</p></section>;

  const [{ data: items, error: itemsError }, { data: members, error: membersError },
    { data: opening, error: openingError }] = await Promise.all([
    supabase.from("monthly_plan_items").select("id,owner_id,kind,label,amount_cents,certainty,remaining_installments,active")
      .eq("relationship_id", membership.relationship_id).eq("active", true).order("created_at"),
    supabase.from("relationship_members").select("user_id").eq("relationship_id", membership.relationship_id).is("revoked_at", null),
    supabase.from("account_opening_balances").select("amount_cents,noted_on,account_id")
      .eq("relationship_id", membership.relationship_id),
  ]);
  if (itemsError || membersError || openingError) return <p role="alert" className="form-error">Não foi possível carregar os dados financeiros. Atualize a página.</p>;
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,display_name")
    .in("id", members?.map(member => member.user_id) ?? []);
  if (profilesError) return <p role="alert" className="form-error">Não foi possível carregar os participantes.</p>;

  return <MonthlyPlanner relationshipId={membership.relationship_id} userId={auth.user.id}
    names={Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile.display_name]))}
    initialItems={(items ?? []) as PlanItem[]}
    openingBalances={opening ?? []} />;
}
