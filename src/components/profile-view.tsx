"use client";
import Link from "next/link";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./primitives";
import { Button } from "./ui/button";
export function ProfileView() {
  const { actor, setActor } = useDemo();
  return <><PageHeading eyebrow="NOSSO ESPAÇO" title="Duas pessoas. Um futuro." description="Identidade própria, transparência e planos compartilhados." /><div className="dashboard-columns"><section className="panel"><h2>Explorar como participante</h2><p className="muted mt-3">Troque o participante fictício para experimentar as permissões da interface. Isso não é autenticação.</p><label className="form-stack">Participante da demonstração<select value={actor} onChange={e => setActor(e.target.value)}><option value="a">Pessoa A · gato</option><option value="b">Letícia · cachorrinha</option></select></label><p className="footnote">Cada pessoa modifica seus registros individuais. Ambas podem operar registros compartilhados e visualizar o espaço do relacionamento.</p></section><section className="panel"><h2>Acesso à conta</h2><p className="muted my-4">A tela de autenticação está preparada para Supabase. Os dados financeiros reais e o vínculo entre parceiros ainda não estão conectados à interface.</p><Button variant="outline" asChild><Link href="/entrar">Abrir autenticação</Link></Button></section></div><section className="panel mt-6"><h2>Nossos princípios</h2><p className="muted mt-3">Boa administração, honestidade, planejamento, contentamento e generosidade. Uma experiência acolhedora para conversar sobre dinheiro e tomar decisões com responsabilidade.</p><p className="footnote">Configuração de permissões, convites de relacionamento e notificações ficam para próximas sprints.</p></section></>;
}
