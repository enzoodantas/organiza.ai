import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Heart, Leaf } from "lucide-react";
import { challengeTotalCents } from "@/domain/challenge";
import { moneyFromCents } from "@/domain/finance";
import { type AccountPosition, type FinancialEntry, type NumberContribution } from "@/lib/finance/records";
import { Button } from "./ui/button";
import { Mascot } from "./mascot";
import { PageHeading, Progress } from "./primitives";

export function RealDashboard({ positions, entries, contributions }: {
  positions: AccountPosition[];
  entries: FinancialEntry[];
  contributions: NumberContribution[];
}) {
  const balance = positions.reduce((sum, item) => sum + BigInt(item.balance_cents), 0n);
  const reserved = positions.reduce((sum, item) => sum + BigInt(item.reserved_cents), 0n);
  const activeEntries = entries.filter(item => !item.reversed_at);
  const income = activeEntries.filter(item => item.kind === "income")
    .reduce((sum, item) => sum + BigInt(item.amount_cents), 0n);
  const expense = activeEntries.filter(item => item.kind === "expense")
    .reduce((sum, item) => sum + BigInt(item.amount_cents), 0n);
  const activeContributions = contributions.filter(item => !item.reversed_at);
  const saved = activeContributions.reduce((sum, item) => sum + BigInt(item.amount_cents), 0n);
  return <>
    <PageHeading eyebrow="NOSSA JORNADA COMEÇA AQUI" title="Cuidar do hoje. Sonhar a dois." description="Seu resumo financeiro salvo no banco local." />
    <section className="hero-card">
      <div className="hero-copy"><span className="soft-tag"><Heart size={13} /> NOSSO GRANDE PLANO</span><h2>O próximo capítulo<br />é construído juntos.</h2><p>Pequenos passos reais para o nosso futuro.</p><Button asChild><Link href="/desafios">Cuidar da nossa meta <ArrowUpRight size={17} /></Link></Button></div>
      <div className="hero-scene"><div className="scene-sun" /><div className="scene-hill" /><div className="scene-house"><span>♡</span></div><Mascot animal="cat" className="hero-cat" /><Mascot animal="dog" className="hero-dog" /><span className="scene-caption">JUNTOS, NO MESMO CAMINHO</span></div>
    </section>
    <div className="section-title"><h2>Nosso dinheiro, com clareza</h2><Link href="/financas">Ver finanças <ChevronRight size={15} /></Link></div>
    <section className="stat-grid" aria-label="Resumo financeiro salvo">
      <article className="stat-card balance"><span>Saldo livre <Leaf size={17} /></span><strong>{moneyFromCents(balance - reserved)}</strong><small>Saldo das contas menos reservas ativas</small></article>
      <article className="stat-card"><span>Receitas registradas <ArrowDownLeft className="positive" size={18} /></span><strong>{moneyFromCents(income)}</strong><small>Não inclui saldos iniciais nem transferências</small></article>
      <article className="stat-card"><span>Despesas registradas <ArrowUpRight className="expense" size={18} /></span><strong>{moneyFromCents(expense)}</strong><small>Pagamentos efetivos; sem reservas</small></article>
    </section>
    <div className="dashboard-columns"><section className="panel challenge-summary"><div className="section-title"><h2>Um número. Um passo.</h2><span className="small-tag">META DO CASAL</span></div><p className="muted">De 1 a 200, construindo o nosso sim.</p>
      <div className="goal-value"><strong>{moneyFromCents(saved)}</strong><span>de {moneyFromCents(challengeTotalCents)}</span></div>
      <Progress value={Number(saved) / challengeTotalCents * 100} label="Progresso da meta do casamento" />
      <div className="goal-caption"><span>{activeContributions.length} de 200 números</span><strong>{(Number(saved) / challengeTotalCents * 100).toFixed(1).replace(".", ",")}% da meta</strong></div>
      <Button variant="outline" asChild className="w-full"><Link href="/desafios">Abrir a meta <ChevronRight size={16} /></Link></Button>
      <p className="footnote">As reservas continuam dentro das contas.</p></section>
      <section className="panel"><div className="section-title"><h2>Últimos movimentos</h2><Link href="/financas">Ver todos <ChevronRight size={15} /></Link></div>
        {!activeEntries.length ? <p className="muted mt-6">Nenhuma movimentação efetiva registrada. O planejamento mensal continua disponível separadamente.</p> :
          activeEntries.slice(0, 4).map(item => <div className="transaction-preview" key={item.id}><span className="transaction-icon">{item.kind === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><div><strong>{item.description}</strong><small>{item.kind === "transfer" ? "Transferência" : item.kind === "income" ? "Receita" : "Despesa"}</small></div><b>{item.kind === "expense" ? "−" : item.kind === "income" ? "+" : ""}{moneyFromCents(item.amount_cents)}</b></div>)}
      </section></div>
    <p className="closing-note">“Com sabedoria se constrói a casa.” <span>Provérbios 24:3 · um lembrete para caminhar com propósito.</span></p>
  </>;
}
