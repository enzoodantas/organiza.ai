import { LoginForm } from "@/components/login-form";
import { PageHeading } from "@/components/primitives";
import { supabaseConfig } from "@/lib/supabase/config";
export const metadata = { title: "Entrar" };
export default function Page() {
  const configured = supabaseConfig();
  return <><PageHeading eyebrow="ACESSO À CONTA" title="Bem-vindos ao próximo passo." description="Autenticação preparada para Supabase Auth." /><section className="panel max-w-lg">{configured ? <><h2>Entrar na sua conta</h2><p className="muted mt-3">Use uma conta de teste criada no seu projeto Supabase. As áreas financeiras permanecem em demonstração nesta sprint.</p><LoginForm /></> : <><h2>Supabase ainda não configurado</h2><p className="muted mt-3">Configure as variáveis indicadas em .env.example e siga o README para habilitar esta tela. Nenhuma credencial foi criada ou presumida.</p></>}</section></>;
}
