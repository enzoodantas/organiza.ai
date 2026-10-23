import { Dashboard } from "@/components/dashboard";
import { RealDashboard } from "@/components/real-dashboard";
import { serverClient } from "@/lib/supabase/server";
import { type AccountPosition, type FinancialEntry, type NumberContribution } from "@/lib/finance/records";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await serverClient();
  if (!supabase) return <Dashboard />;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <Dashboard />;
  const { data: membership, error: memberError } = await supabase.from("relationship_members")
    .select("relationship_id").eq("user_id", auth.user.id).is("revoked_at", null).maybeSingle();
  if (memberError) return <p role="alert" className="form-error">Não foi possível carregar seu espaço.</p>;
  if (!membership) return <section className="panel"><h1>Bem-vindo ao Nosso Futuro</h1><p className="muted mt-3">Conclua o vínculo em <a href="/conta">Minha conta</a> para começar.</p></section>;
  const relationshipId = membership.relationship_id;
  const [positionsResult, entriesResult, contributionsResult] = await Promise.all([
    supabase.rpc("list_account_positions", { target_relationship: relationshipId }),
    supabase.from("financial_entries").select("id,owner_id,scope,kind,amount_cents,source_account_id,destination_account_id,description,occurred_on,reversed_at,created_at")
      .eq("relationship_id", relationshipId).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("contributions").select("id,participant_id,source_account_id,slot,amount_cents,reversed_at,created_at")
      .eq("relationship_id", relationshipId).limit(300),
  ]);
  if (positionsResult.error || entriesResult.error || contributionsResult.error)
    return <p role="alert" className="form-error">Não foi possível carregar seu resumo financeiro. Atualize a página.</p>;
  return <RealDashboard positions={(positionsResult.data ?? []) as AccountPosition[]}
    entries={(entriesResult.data ?? []) as FinancialEntry[]}
    contributions={(contributionsResult.data ?? []) as NumberContribution[]} />;
}
