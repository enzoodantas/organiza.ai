import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Button } from "@/components/ui/button";
import { AccountOnboarding } from "@/components/account-onboarding";

export const metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";

type Invitation = {
  id: string;
  direction: "received" | "sent";
  relationship_name: string;
  other_name: string;
  expires_at: string;
};

export default async function Page() {
  const supabase = await serverClient();
  if (!supabase) redirect("/entrar");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/entrar");

  const [{ data: profile, error: profileError }, { data: membership, error: memberError },
    { data: invitations, error: invitationError }] = await Promise.all([
    supabase.from("profiles").select("display_name,mascot").eq("id", auth.user.id).maybeSingle(),
    supabase.from("relationship_members").select("relationship_id").eq("user_id", auth.user.id).is("revoked_at", null).maybeSingle(),
    supabase.rpc("list_relationship_invitations"),
  ]);

  let relationship: { id: string; name: string } | null = null;
  let members: { user_id: string; profiles: { display_name: string } | null }[] = [];
  let detailError = false;
  if (membership) {
    const [relationshipResult, membersResult] = await Promise.all([
      supabase.from("relationships").select("id,name").eq("id", membership.relationship_id).single(),
      supabase.from("relationship_members").select("user_id")
        .eq("relationship_id", membership.relationship_id).is("revoked_at", null),
    ]);
    relationship = relationshipResult.data;
    detailError = !!relationshipResult.error || !!membersResult.error;
    if (membersResult.data?.length) {
      const { data: memberProfiles, error: namesError } = await supabase.from("profiles")
        .select("id,display_name").in("id", membersResult.data.map((member) => member.user_id));
      detailError ||= !!namesError;
      members = membersResult.data.map((member) => ({
        user_id: member.user_id,
        profiles: memberProfiles?.find((person) => person.id === member.user_id) ?? null,
      }));
    }
  }

  const loadError = !!profileError || !!memberError || !!invitationError || detailError;
  return <section className="panel max-w-2xl">
    <h1>Minha conta</h1>
    <p className="muted mt-3">O planejamento mensal está salvo no banco local. As movimentações e o desafio ainda são demonstração.</p>
    {loadError ? <p role="alert" className="form-error mt-6">Não foi possível carregar o vínculo. Atualize a página e tente novamente.</p>
      : <AccountOnboarding
        email={auth.user.email ?? ""}
        profile={profile}
        relationship={relationship}
        members={members}
        invitations={(invitations ?? []) as Invitation[]}
      />}
    <form action={signOut} className="mt-8"><Button variant="outline">Sair da conta</Button></form>
  </section>;
}
