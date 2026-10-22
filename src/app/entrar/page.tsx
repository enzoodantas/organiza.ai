import { LoginForm } from "@/components/login-form";
import { PageHeading } from "@/components/primitives";
import { supabaseConfig } from "@/lib/supabase/config";
export const metadata = { title: "Entrar" };
export default function Page() {
  const configured = supabaseConfig();
  return <><PageHeading eyebrow="ACESSO À CONTA" title="Bem-vindos ao próximo passo." description="Entre com a sua conta do casal." /><section className="panel max-w-lg">{configured ? <><h2>Entrar na sua conta</h2><p className="muted mt-3">Use o e-mail e a senha definidos no convite local. O planejamento está salvo no banco local; as movimentações e o desafio ainda são demonstração.</p><LoginForm /></> : <><h2>Supabase ainda não configurado</h2><p className="muted mt-3">Configure as variáveis indicadas em .env.example e siga o README para habilitar esta tela. Nenhuma credencial foi criada ou presumida.</p></>}</section></>;
}
