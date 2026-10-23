import { FinanceView } from "@/components/finance-view";
import { RealFinanceView } from "@/components/real-finance-view";
import { serverClient } from "@/lib/supabase/server";
import { type AccountPosition, type FinancialAccount, type FinancialEntry,
  type OpeningBalance } from "@/lib/finance/records";

export const metadata = { title: "Finanças" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await serverClient();
  if (!supabase) return <FinanceView />;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <FinanceView />;
  const { data: membership, error: memberError } = await supabase.from("relationship_members")
    .select("relationship_id").eq("user_id", auth.user.id).is("revoked_at", null).maybeSingle();
  if (memberError) return <p role="alert" className="form-error">Não foi possível carregar seu vínculo financeiro.</p>;
  if (!membership) return <section className="panel"><h1>Finanças</h1><p className="muted mt-3">Conclua seu vínculo em <a href="/conta">Minha conta</a> antes de registrar movimentações.</p></section>;

  const relationshipId = membership.relationship_id;
  const [accountsResult, positionsResult, entriesResult, openingResult, membersResult] = await Promise.all([
    supabase.from("accounts").select("id,owner_id,name,scope").eq("relationship_id", relationshipId).order("name"),
    supabase.rpc("list_account_positions", { target_relationship: relationshipId }),
    supabase.from("financial_entries").select("id,owner_id,scope,kind,amount_cents,source_account_id,destination_account_id,description,occurred_on,reversed_at,created_at")
      .eq("relationship_id", relationshipId).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("account_opening_balances").select("account_id,amount_cents,noted_on").eq("relationship_id", relationshipId),
    supabase.from("relationship_members").select("user_id").eq("relationship_id", relationshipId).is("revoked_at", null),
  ]);
  if (accountsResult.error || positionsResult.error || entriesResult.error || openingResult.error || membersResult.error)
    return <p role="alert" className="form-error">Não foi possível carregar as finanças. Atualize a página.</p>;
  const { data: profiles, error: profilesError } = await supabase.from("profiles")
    .select("id,display_name").in("id", (membersResult.data ?? []).map(member => member.user_id));
  if (profilesError) return <p role="alert" className="form-error">Não foi possível carregar os participantes.</p>;
  return <RealFinanceView relationshipId={relationshipId} userId={auth.user.id}
    names={Object.fromEntries((profiles ?? []).map(profile => [profile.id, profile.display_name]))}
    initialAccounts={(accountsResult.data ?? []) as FinancialAccount[]}
    initialPositions={(positionsResult.data ?? []) as AccountPosition[]}
    initialEntries={(entriesResult.data ?? []) as FinancialEntry[]}
    initialOpening={(openingResult.data ?? []) as OpeningBalance[]} />;
}
