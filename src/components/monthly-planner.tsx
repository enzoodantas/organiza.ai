"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { money, parseMoney } from "@/domain/finance";
import { Button } from "@/components/ui/button";

export type PlanItem = {
  id: string; owner_id: string; kind: "income" | "expense"; label: string;
  amount_cents: number; certainty: "regular" | "variable";
  remaining_installments: number | null; active: boolean;
};

function valueText(cents: number) { return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`; }

export function MonthlyPlanner({ relationshipId, userId, names, initialItems, openingBalances }: {
  relationshipId: string; userId: string; names: Record<string, string>; initialItems: PlanItem[];
  openingBalances: { amount_cents: number; noted_on: string; account_id: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [feedbackFor, setFeedbackFor] = useState("");
  const ownSection = useRef<HTMLElement>(null);

  function feedback(target: string) {
    if (feedbackFor !== target) return null;
    return <div className="plan-feedback">{busy && <p role="status">Salvando alteração…</p>}{error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-success">{notice}</p>}</div>;
  }
  const regularIncome = items.filter(item => item.kind === "income" && item.certainty === "regular")
    .reduce((sum, item) => sum + item.amount_cents, 0);
  const variableIncome = items.filter(item => item.kind === "income" && item.certainty === "variable")
    .reduce((sum, item) => sum + item.amount_cents, 0);
  const expenses = items.filter(item => item.kind === "expense").reduce((sum, item) => sum + item.amount_cents, 0);

  async function save(event: FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    if (busy) return;
    setFeedbackFor(id ?? "new");
    setBusy(true); setError(""); setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const label = String(data.get("label") ?? "").trim();
      if (!label || label.length > 100) throw new Error("Informe uma descrição de até 100 caracteres.");
      const amount_cents = parseMoney(String(data.get("amount") ?? ""));
      const kind = data.get("kind") === "income" ? "income" : "expense";
      const certainty = data.get("certainty") === "variable" ? "variable" : "regular";
      const rawInstallments = String(data.get("remaining_installments") ?? "").trim();
      const remaining_installments = rawInstallments ? Number(rawInstallments) : null;
      if (remaining_installments !== null && (!Number.isInteger(remaining_installments) || remaining_installments < 1 || remaining_installments > 600))
        throw new Error("Informe de 1 a 600 parcelas restantes.");
      const supabase = browserClient();
      if (id) {
        const { data: updated, error: updateError } = await supabase.from("monthly_plan_items")
          .update({ label, amount_cents, certainty, remaining_installments })
          .eq("id", id).eq("owner_id", userId).select("id").single();
        if (updateError || !updated) throw new Error("Não foi possível salvar. Confira a sessão e tente novamente.");
        setItems(current => current.map(item => item.id === id ? { ...item, label, amount_cents, certainty, remaining_installments } : item));
      } else {
        const { data: inserted, error: insertError } = await supabase.from("monthly_plan_items")
          .insert({ relationship_id: relationshipId, owner_id: userId, kind, label, amount_cents, certainty, remaining_installments })
          .select("id,owner_id,kind,label,amount_cents,certainty,remaining_installments,active").single();
        if (insertError || !inserted) throw new Error("Não foi possível adicionar. Confira a sessão e tente novamente.");
        setItems(current => [...current, inserted as PlanItem]);
        form.reset();
      }
      setNotice(`Estimativa “${label}” salva. Nenhum pagamento foi registrado.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally { setBusy(false); }
  }

  async function archive(item: PlanItem) {
    if (busy || !window.confirm(`Retirar a estimativa “${item.label}” do planejamento? Ela deixará de entrar nos totais. Nenhum pagamento será alterado e o histórico será preservado.`)) return;
    setFeedbackFor(item.id); setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: archiveError } = await browserClient().from("monthly_plan_items")
        .update({ active: false }).eq("id", item.id).eq("owner_id", userId).select("id").single();
      if (archiveError || !data) throw new Error("Não foi possível retirar a estimativa. Tente novamente.");
      setItems(current => current.filter(row => row.id !== item.id));
      setFeedbackFor("archive");
      setNotice(`Estimativa “${item.label}” retirada dos totais. O histórico foi preservado.`);
      ownSection.current?.focus();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A conexão falhou. Confira o planejamento antes de tentar novamente.");
    } finally { setBusy(false); }
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">NOSSOS NÚMEROS REAIS</p><h1>Planejamento mensal</h1><p className="page-description">Suas estimativas de receitas e gastos. Revise os valores a cada mês.</p></div></div>
    <p className="prepared-note">Estes valores são estimativas e podem estar errados. Alterar uma estimativa não registra pagamento, depósito ou aporte no desafio.</p>
    <div className="stat-grid mt-6">
      <div className="stat-card"><span>Receita mensal regular estimada</span><strong>{money(regularIncome)}</strong><small>Sem bicos e vendas eventuais</small></div>
      <div className="stat-card"><span>Gastos mensais estimados</span><strong>{money(expenses)}</strong><small>Inclui parcelas ainda previstas</small></div>
      <div className="stat-card balance"><span>Diferença estimada</span><strong>{money(regularIncome - expenses)}</strong><small>Não é saldo disponível confirmado</small></div>
    </div>
    <section className="panel mt-6"><h2>Cofrinho conjunto</h2>
      {openingBalances.length ? openingBalances.map((balance) => <p key={balance.account_id} className="muted mt-3">Saldo inicial informado em {balance.noted_on.split("-").reverse().join("/")}: <strong>{money(balance.amount_cents)}</strong>. Já estava guardado; não entrou nas receitas acima.</p>)
        : <p className="muted mt-3">Nenhum saldo inicial informado.</p>}
      <p className="muted mt-3">Bicos: média eventual de {money(variableIncome)}. Vendas de alfajores estão paradas. Um depósito eventual na caixinha deve ser lançado quando realmente ocorrer.</p>
    </section>
    {Object.entries(names).map(([ownerId, name]) => <section ref={ownerId === userId ? ownSection : undefined} tabIndex={-1} className="panel mt-6" key={ownerId}>
      <h2>{name}</h2><p className="muted mt-2">{ownerId === userId ? "Você pode ajustar suas estimativas." : "Estimativas do outro participante; somente leitura."}</p>
      {ownerId === userId && feedback("archive")}
      <div className="entry-list">{items.filter(item => item.owner_id === ownerId).map(item => ownerId === userId
        ? <form className="plan-item-form" key={item.id} onSubmit={event => save(event, item.id)}>
          <label>Descrição<input name="label" aria-label={`Descrição de ${item.label}`} defaultValue={item.label} maxLength={100} required /></label>
          <label>Valor (R$)<input name="amount" aria-label={`Valor de ${item.label} em reais`} defaultValue={valueText(item.amount_cents)} inputMode="decimal" required /></label>
          <label>Regularidade<select name="certainty" aria-label={`Regularidade de ${item.label}`} defaultValue={item.certainty}><option value="regular">Regular</option><option value="variable">Eventual</option></select></label>
          <label>Parcelas restantes<input name="remaining_installments" aria-label={`Parcelas restantes de ${item.label}`} type="number" min={1} max={600} placeholder="Se houver" defaultValue={item.remaining_installments ?? ""} /></label>
          <span>{item.kind === "income" ? "Receita" : "Gasto"}</span>
          <Button type="submit" disabled={busy}>Salvar<span className="sr-only"> {item.label}</span></Button><Button type="button" variant="ghost" disabled={busy} onClick={() => archive(item)}>Retirar<span className="sr-only"> {item.label}</span></Button>
          {feedback(item.id)}
        </form>
        : <div className="plan-item-read" key={item.id}><span>{item.label}{item.remaining_installments ? ` · ${item.remaining_installments} parcelas restantes` : ""}{item.certainty === "variable" ? " · eventual" : ""}</span><strong>{money(item.amount_cents)}</strong></div>)}</div>
    </section>)}
    <section className="panel mt-6"><h2>Adicionar estimativa minha</h2><form className="form-stack" onSubmit={event => save(event)}>
      <label>Descrição<input name="label" maxLength={100} required placeholder="Ex.: mercado" /></label>
      <div className="form-row"><label>Tipo<select name="kind"><option value="expense">Gasto</option><option value="income">Receita</option></select></label><label>Valor em reais<input name="amount" inputMode="decimal" required placeholder="0,00" /></label></div>
      <div className="form-row"><label>Regularidade<select name="certainty"><option value="regular">Regular</option><option value="variable">Eventual</option></select></label><label>Parcelas restantes, se houver<input name="remaining_installments" type="number" min={1} max={600} /></label></div>
      <Button type="submit" disabled={busy}>Adicionar estimativa</Button>
    {feedback("new")}
    </form></section>
    <p className="footnote mt-6">Conferiu o planejamento da semana? <Link className="underline" href="/mascotes#revisao">Reconheça a revisão e cuide do seu mascote</Link>.</p>
  </>;
}
