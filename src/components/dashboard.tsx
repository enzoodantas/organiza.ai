"use client";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Heart, ChevronRight, Leaf, CalendarDays } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDemo } from "./demo-provider";
import { money, summarize } from "@/domain/finance";
import { challengeProgress, challengeTotalCents } from "@/domain/challenge";
import { Mascot } from "./mascot";
import { PageHeading, Progress } from "./primitives";
import { Button } from "./ui/button";
export function Dashboard() {
  const { entries, contributions } = useDemo();
  const totals = summarize(entries); const saved = challengeProgress(contributions);
  const reduced = useReducedMotion();
  const chart = [{ name: "Receitas", valor: totals.income }, { name: "Despesas", valor: totals.expense }];
  return <>
    <PageHeading eyebrow="NOSSA JORNADA COMEÇA AQUI" title="Cuidar do hoje. Sonhar a dois." description="Mais clareza com o dinheiro, mais espaço para o que importa." action={<span className="date-label"><CalendarDays size={16} /> Cenário fictício · outubro 2026</span>} />
    <motion.section className="hero-card" initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="hero-copy"><span className="soft-tag"><Heart size={13} /> NOSSO GRANDE PLANO</span><h2>O próximo capítulo<br />é construído juntos.</h2><p>Nosso casamento começa nos pequenos<br className="desktop-break" /> passos que damos hoje.</p><Button asChild><Link href="/desafios">Cuidar da nossa meta <ArrowUpRight size={17} /></Link></Button></div>
      <div className="hero-scene"><div className="scene-sun" /><div className="scene-hill" /><div className="scene-house"><span>♡</span></div><Mascot animal="cat" className="hero-cat" /><Mascot animal="dog" className="hero-dog" /><span className="scene-caption">JUNTOS, NO MESMO CAMINHO</span></div>
    </motion.section>
    <div className="section-title"><h2>Nosso dinheiro, com clareza</h2><Link href="/financas">Ver finanças <ChevronRight size={15} /></Link></div>
    <section className="stat-grid" aria-label="Resumo financeiro de demonstração">
      <article className="stat-card balance"><span>Resultado dos lançamentos <Leaf size={17} /></span><strong>{money(totals.balance)}</strong><small>Receitas menos despesas fictícias; sem saldo inicial</small></article>
      <article className="stat-card"><span>Receitas <ArrowDownLeft className="positive" size={18} /></span><strong>{money(totals.income)}</strong><small>Entradas individuais e conjuntas</small></article>
      <article className="stat-card"><span>Despesas <ArrowUpRight className="expense" size={18} /></span><strong>{money(totals.expense)}</strong><small>Saídas individuais e conjuntas</small></article>
    </section>
    <div className="dashboard-columns"><section className="panel challenge-summary"><div className="section-title"><h2>Um número. Um passo.</h2><span className="small-tag">DESAFIO DO CASAL</span></div><p className="muted">De 1 a 200, construindo o nosso sim.</p><div className="goal-value"><strong>{money(saved)}</strong><span>de {money(challengeTotalCents)}</span></div><Progress value={saved / challengeTotalCents * 100} label="Progresso da meta do casamento" /><div className="goal-caption"><span>{contributions.filter(c => !c.reversed).length} de 200 números</span><strong>{(saved / challengeTotalCents * 100).toFixed(1).replace(".", ",")}% do sonho</strong></div><div className="mini-numbers">{[10, 20, 30, 40, 50, 60, 70, 80].map(n => <span className={contributions.some(c => c.number === n && !c.reversed) ? "filled" : ""} key={n}>{n}</span>)}</div><Button variant="outline" asChild className="w-full"><Link href="/desafios">Explorar o desafio <ChevronRight size={16} /></Link></Button><p className="footnote">Aportes representam dinheiro reservado, sem aumentar o saldo.</p></section>
    <section className="panel companions"><div className="section-title"><h2>Companhia para a jornada</h2><Link href="/mascotes" aria-label="Ver mascotes"><ChevronRight size={18} /></Link></div><p className="muted">Crescer nos hábitos, no nosso ritmo.</p><div className="mascot-pair"><div><Mascot animal="cat" /><strong>Enzo</strong><span>Seu companheiro gato</span></div><div><Mascot animal="dog" /><strong>Letícia</strong><span>Sua companheira cachorrinha</span></div></div><div className="prepared-note"><Leaf size={17} /><span>Níveis e recompensas chegam nas próximas etapas.</span></div></section></div>
    <div className="dashboard-columns lower"><section className="panel"><div className="section-title"><h2>Entradas e saídas</h2><span className="muted">Exemplo atual</span></div><div className="chart-container"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={chart} accessibilityLayer><XAxis dataKey="name" axisLine={false} tickLine={false} /><Tooltip formatter={value => money(Number(value))} cursor={{ fill: "#f1f3ec" }} /><Bar isAnimationActive={!reduced} dataKey="valor" name="Valor" fill="#52745c" radius={[7, 7, 0, 0]} maxBarSize={60} /></BarChart></ResponsiveContainer></div><p className="footnote">Os mesmos totais estão disponíveis nos cartões acima.</p></section><section className="panel"><div className="section-title"><h2>Últimos movimentos</h2><Link href="/financas">Ver todos <ChevronRight size={15} /></Link></div>{entries.filter(e => !e.reversed).slice(0, 3).map(e => <div className="transaction-preview" key={e.id}><span className="transaction-icon">{e.kind === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><div><strong>{e.description}</strong><small>{e.scope === "shared" ? "Do casal" : "Individual"}</small></div><b>{e.kind === "expense" ? "−" : "+"}{money(e.amountCents)}</b></div>)}</section></div>
    <p className="closing-note">“Com sabedoria se constrói a casa.” <span>Provérbios 24:3 · um lembrete para caminhar com propósito.</span></p>
  </>;
}
