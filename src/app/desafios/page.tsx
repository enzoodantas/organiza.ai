import { listContributions } from "@/lib/finance/queries";
import { ChallengeView } from "@/components/challenge-view";
import { RealChallengeView } from "@/components/real-challenge-view";
import { serverClient } from "@/lib/supabase/server";
import { type AccountPosition, type FinancialAccount, type NumberContribution } from "@/lib/finance/records";

export const metadata = { title: "Desafios" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await serverClient();
  if (!supabase) return <ChallengeView />;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <ChallengeView />;
  const { data: membership, error: memberError } = await supabase.from("relationship_members")
    .select("relationship_id").eq("user_id", auth.user.id).is("revoked_at", null).maybeSingle();
  if (memberError) return <p role="alert" className="form-error">Não foi possível carregar o vínculo do casal.</p>;
  if (!membership) return <section className="panel"><h1>Desafio</h1><p className="muted mt-3">Conclua o vínculo em <a href="/conta">Minha conta</a> para usar a meta.</p></section>;

  const relationshipId = membership.relationship_id;
  const [accountsResult, positionsResult, contributionsResult, campaignResult, membersResult] = await Promise.all([
    supabase.from("accounts").select("id,owner_id,name,scope").eq("relationship_id", relationshipId).order("name"),
    supabase.rpc("list_account_positions", { target_relationship: relationshipId }),
    listContributions(supabase, relationshipId),
    supabase.from("campaigns").select("id").eq("relationship_id", relationshipId).eq("rules->>type", "number_grid").maybeSingle(),
    supabase.from("relationship_members").select("user_id").eq("relationship_id", relationshipId).is("revoked_at", null),
  ]);
  if (accountsResult.error || positionsResult.error || contributionsResult.error || campaignResult.error || membersResult.error)
    return <p role="alert" className="form-error">Não foi possível carregar o desafio. Atualize a página.</p>;
  const { data: profiles, error: profilesError } = await supabase.from("profiles")
    .select("id,display_name").in("id", (membersResult.data ?? []).map(member => member.user_id));
  if (profilesError) return <p role="alert" className="form-error">Não foi possível carregar os participantes.</p>;
  return <RealChallengeView relationshipId={relationshipId} userId={auth.user.id}
    names={Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile.display_name]))}
    initialAccounts={(accountsResult.data ?? []) as FinancialAccount[]}
    initialPositions={(positionsResult.data ?? []) as AccountPosition[]}
    initialContributions={(contributionsResult.data ?? []) as NumberContribution[]}
    initialCampaignId={campaignResult.data?.id ?? null} />;
}
