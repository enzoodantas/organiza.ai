import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function Page() {
  const supabase = await serverClient(); if (!supabase) redirect("/entrar");
  const { data, error } = await supabase.auth.getUser(); if (error || !data.user) redirect("/entrar");
  return <section className="panel"><h1>Conta autenticada</h1><p className="muted mt-4">Sessão validada no servidor. A conexão das finanças reais e o cadastro do relacionamento pertencem à próxima sprint.</p><form action={signOut} className="mt-6"><Button variant="outline">Sair da conta</Button></form></section>;
}
