"use client";
import { useState, type FormEvent } from "react";
import { Mic, Plus } from "lucide-react";
import { useDemo } from "./demo-provider";
import { canWrite, money, parseMoney, summarize, type Scope } from "@/domain/finance";
import { demoMembers } from "@/lib/demo/data";
import { Button } from "./ui/button";
import Link from "next/link";
import { Empty, PageHeading } from "./primitives";
export function FinanceView() {
  const { entries, actor, addEntry, reverseEntry } = useDemo();
  const [filter, setFilter] = useState("all"); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const visible = entries.filter(e => filter === "all" || (filter === "shared" ? e.scope === "shared" : e.scope === "individual" && e.ownerId === filter));
  const totals = summarize(visible);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); const form = event.currentTarget; const data = new FormData(form);
    try { addEntry({ kind: data.get("kind") === "income" ? "income" : "expense", scope: data.get("scope") as Scope, amountCents: parseMoney(String(data.get("amount"))), description: String(data.get("description")) }); form.reset(); setNotice("Movimentação adicionada somente à demonstração."); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar."); }
  }
  return <><PageHeading eyebrow="CUIDADO COM O PRESENTE" title="Cada movimento conta." description="Entenda as entradas e saídas de cada pessoa e do casal." />
    <p className="prepared-note mb-6">Aqui os lançamentos são fictícios. <Link href="/planejamento">Abrir o planejamento mensal salvo no banco</Link>.</p>
    <div className="filter-bar"><label htmlFor="finance-filter">Visualizar</label><select id="finance-filter" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Consolidado do casal</option><option value="a">Enzo · individual</option><option value="b">Letícia · individual</option><option value="shared">Espaço conjunto</option></select><strong>Resultado dos lançamentos: {money(totals.balance)}</strong></div>
    <div className="finance-columns"><section className="panel"><div className="section-title"><h2>Movimentações</h2><span className="small-tag">DADOS FICTÍCIOS</span></div>{visible.length === 0 ? <Empty>Nenhuma movimentação nesta visão.</Empty> : <ul className="entry-list">{visible.map(e => <li key={e.id} className={e.reversed ? "reversed" : ""}><div><strong>{e.description}</strong><small>{e.date.split("-").reverse().join("/")} · {e.ownerId === "a" ? "Enzo" : "Letícia"} · {e.scope === "shared" ? "Conjunto" : "Individual"}</small><span>{e.kind === "income" ? "Receita" : "Despesa"} · {money(e.amountCents)}</span></div>{e.reversed ? <span className="small-tag">Revertido</span> : canWrite(e, actor, demoMembers) ? <Button variant="ghost" onClick={() => reverseEntry(e.id)} aria-label={`Reverter ${e.description}`}>Reverter</Button> : <small>Somente leitura</small>}</li>)}</ul>}</section>
    <section className="panel" id="novo"><h2 className="mb-2">Registrar movimentação</h2><p className="muted">Ação de demonstração como {actor === "a" ? "Enzo" : "Letícia"}.</p><form onSubmit={submit} className="form-stack"><label>Descrição<input name="description" placeholder="Ex.: mercado da semana" required maxLength={120} /></label><div className="form-row"><label>Tipo<select name="kind"><option value="expense">Despesa</option><option value="income">Receita</option></select></label><label>Valor (R$)<input name="amount" inputMode="decimal" placeholder="0,00" required /></label></div><label>Espaço<select name="scope"><option value="individual">Individual · meu lançamento</option><option value="shared">Compartilhado · do casal</option></select></label>{error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-success">{notice}</p>}<Button type="submit"><Plus size={17} /> Adicionar à demonstração</Button><p className="voice-placeholder"><Mic size={16} /> Entrada por voz prevista para uma próxima sprint.</p></form></section></div></>;
}
