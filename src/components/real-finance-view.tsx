"use client";
import { listEntries } from "@/lib/finance/queries";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { moneyFromCents, parseMoney } from "@/domain/finance";
import { type AccountPosition, type FinancialAccount, type FinancialEntry,
  type OpeningBalance, localToday } from "@/lib/finance/records";
import { Button } from "./ui/button";
import { Empty, PageHeading } from "./primitives";

function rpcMessage(code: string | undefined): string {
  if (code === "22003") return "Saldo livre insuficiente para esta operação.";
  if (code === "42501") return "Esta conta ou operação não está autorizada para sua sessão.";
  if (code === "23505") return "Esta operação já foi registrada ou usa uma requisição diferente. Atualize os dados.";
  return "Não foi possível concluir a operação. Confira os dados e tente novamente.";
}

function openingAmount(input: string): number {
  const trimmed = input.trim();
  if (/^0([,.]0{1,2})?$/.test(trimmed)) return 0;
  return parseMoney(trimmed);
}

export function RealFinanceView({ relationshipId, userId, names, initialAccounts,
  initialPositions, initialEntries, initialOpening }: {
  relationshipId: string;
  userId: string;
  names: Record<string, string>;
  initialAccounts: FinancialAccount[];
  initialPositions: AccountPosition[];
  initialEntries: FinancialEntry[];
  initialOpening: OpeningBalance[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [positions, setPositions] = useState(initialPositions);
  const [entries, setEntries] = useState(initialEntries);
  const [opening, setOpening] = useState(initialOpening);
  const [month, setMonth] = useState(localToday().slice(0, 7));
  const [filterAccount, setFilterAccount] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [kind, setKind] = useState<"income" | "expense" | "transfer">("expense");
  const [accountScope, setAccountScope] = useState<"individual" | "shared">("individual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const accountRequest = useRef<{ fingerprint: string; key: string } | null>(null);

  const writable = accounts.filter(account => account.scope === "shared" || account.owner_id === userId);
  const positionMap = new Map(positions.map(item => [item.account_id, item]));
  const accountMap = new Map(accounts.map(item => [item.id, item]));
  const openingMap = new Map(opening.map(item => [item.account_id, item]));
  const totalBalance = positions.reduce((sum, item) => sum + BigInt(item.balance_cents), 0n);
  const totalReserved = positions.reduce((sum, item) => sum + BigInt(item.reserved_cents), 0n);

  const filteredEntries = entries.filter(entry =>
    (!month || entry.occurred_on.startsWith(month)) &&
    (!filterAccount || entry.source_account_id === filterAccount || entry.destination_account_id === filterAccount) &&
    (!filterKind || entry.kind === filterKind));

  async function refresh() {
    const supabase = browserClient();
    const [accountsResult, positionsResult, entriesResult, openingResult] = await Promise.all([
      supabase.from("accounts").select("id,owner_id,name,scope").eq("relationship_id", relationshipId).order("name"),
      supabase.rpc("list_account_positions", { target_relationship: relationshipId }),
      listEntries(supabase, relationshipId),
      supabase.from("account_opening_balances").select("account_id,amount_cents,noted_on").eq("relationship_id", relationshipId),
    ]);
    if (accountsResult.error || positionsResult.error || entriesResult.error || openingResult.error)
      throw new Error("Não foi possível atualizar as contas. Recarregue a página.");
    setAccounts((accountsResult.data ?? []) as FinancialAccount[]);
    setPositions((positionsResult.data ?? []) as AccountPosition[]);
    setEntries((entriesResult.data ?? []) as FinancialEntry[]);
    setOpening((openingResult.data ?? []) as OpeningBalance[]);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    try {
      const openingCents = openingAmount(String(data.get("opening") ?? "0"));
      const accountName = String(data.get("name") ?? "").trim();
      const openingOn = String(data.get("opening_on") ?? "");
      const fingerprint = JSON.stringify([accountName, accountScope, openingCents, openingOn]);
      if (accountRequest.current?.fingerprint !== fingerprint)
        accountRequest.current = { fingerprint, key: crypto.randomUUID() };
      const { error: requestError } = await browserClient().rpc("create_financial_account", {
        target_relationship: relationshipId,
        account_name: accountName,
        account_scope: accountScope,
        opening_cents: openingCents,
        opening_on: openingOn,
        request_key: accountRequest.current.key,
      });
      if (requestError) throw new Error(rpcMessage(requestError.code));
      await refresh();
      accountRequest.current = null;
      form.reset();
      setNotice("Conta criada com saldo inicial registrado separadamente das receitas.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar a conta.");
    } finally { setBusy(false); }
  }

  async function recordEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    try {
      const amount = parseMoney(String(data.get("amount") ?? ""));
      const source = kind === "income" ? null : String(data.get("source") ?? "") || null;
      const destination = kind === "expense" ? null : String(data.get("destination") ?? "") || null;
      const description = String(data.get("description") ?? "").trim();
      const occurredOn = String(data.get("occurred_on") ?? "");
      if ((kind !== "income" && !source) || (kind !== "expense" && !destination))
        throw new Error("Selecione a conta envolvida na movimentação.");
      const fingerprint = JSON.stringify([kind, amount, source, destination, description, occurredOn]);
      if (request.current?.fingerprint !== fingerprint)
        request.current = { fingerprint, key: crypto.randomUUID() };
      const { error: requestError } = await browserClient().rpc("record_financial_entry", {
        target_relationship: relationshipId,
        entry_kind: kind,
        amount_cents: amount,
        source_id: source,
        destination_id: destination,
        entry_description: description,
        entry_on: occurredOn,
        request_key: request.current.key,
      });
      if (requestError) throw new Error(rpcMessage(requestError.code));
      await refresh();
      request.current = null;
      form.reset();
      setNotice("Movimentação salva no banco e saldo atualizado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar.");
    } finally { setBusy(false); }
  }

  async function reverseEntry(entry: FinancialEntry) {
    if (busy || !window.confirm(`Reverter “${entry.description}” de ${moneyFromCents(entry.amount_cents)}? O histórico será preservado.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: requestError } = await browserClient().rpc("reverse_financial_entry", { entry_id: entry.id });
      if (requestError) throw new Error(rpcMessage(requestError.code));
      await refresh();
      setNotice("Movimentação revertida. O histórico foi preservado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível reverter.");
    } finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="DINHEIRO DO CASAL" title="Finanças reais, com clareza." description="Saldos e movimentações salvos no seu espaço." />
    <p className="prepared-note mb-6">O <Link href="/planejamento">planejamento mensal</Link> contém estimativas. Registre aqui somente movimentações que já aconteceram. O saldo inicial não é receita.</p>
    <div className="stat-grid">
      <article className="stat-card balance"><span>Saldo total das contas</span><strong>{moneyFromCents(totalBalance)}</strong><small>Saldo inicial mais movimentações ativas</small></article>
      <article className="stat-card"><span>Reservado para a meta</span><strong>{moneyFromCents(totalReserved)}</strong><small>Continua nas contas; não é despesa</small></article>
      <article className="stat-card"><span>Saldo livre</span><strong>{moneyFromCents(totalBalance - totalReserved)}</strong><small>Disponível após as reservas</small></article>
    </div>
    {error && <p role="alert" className="form-error mt-6">{error}</p>}
    {notice && <p role="status" className="form-success mt-6">{notice}</p>}
    <section className="panel mt-6"><h2>Contas</h2>
      {!accounts.length ? <Empty>Crie sua primeira conta para começar o registro financeiro.</Empty> :
        <div className="entry-list">{accounts.map(account => {
          const position = positionMap.get(account.id);
          const initial = openingMap.get(account.id);
          return <div className="ledger-account" key={account.id}>
            <div><strong>{account.name}</strong><small>{account.scope === "shared" ? "Conjunta" : `Individual · ${names[account.owner_id ?? ""] ?? "Participante"}`}</small>
              {initial && <small>Saldo inicial em {initial.noted_on.split("-").reverse().join("/")}: {moneyFromCents(initial.amount_cents)}</small>}</div>
            <div><strong>{moneyFromCents(position?.balance_cents ?? "0")}</strong><small>Reservado: {moneyFromCents(position?.reserved_cents ?? "0")}</small><small>Livre: {moneyFromCents(position?.available_cents ?? "0")}</small></div>
          </div>;
        })}</div>}
    </section>
    <div className="finance-columns mt-6">
      <section className="panel"><h2>Registrar movimentação</h2>
        <form className="form-stack mt-4" onSubmit={recordEntry}>
          <label>Tipo<select name="kind" value={kind} onChange={event => setKind(event.target.value as typeof kind)}>
            <option value="expense">Despesa</option><option value="income">Receita</option><option value="transfer">Transferência entre contas</option>
          </select></label>
          <label>Descrição<input name="description" maxLength={120} placeholder="Ex.: mercado" required /></label>
          <div className="form-row"><label>Valor (R$)<input name="amount" inputMode="decimal" placeholder="0,00" required /></label>
            <label>Data<input name="occurred_on" type="date" defaultValue={localToday()} max={localToday()} required /></label></div>
          {kind !== "income" && <label>Conta de origem<select name="source" required defaultValue=""><option value="">Selecione</option>{writable.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
          {kind !== "expense" && <label>Conta de destino<select name="destination" required defaultValue=""><option value="">Selecione</option>{writable.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}
          <Button disabled={busy || !writable.length}>{busy ? "Salvando…" : "Salvar movimentação"}</Button>
          <p className="footnote">Transferências não criam receita. A operação é recusada quando falta saldo livre.</p>
        </form>
      </section>
      <section className="panel"><h2>Criar conta</h2>
        <form className="form-stack mt-4" onSubmit={createAccount}>
          <label>Nome<input name="name" maxLength={100} placeholder="Ex.: minha conta" required /></label>
          <label>Espaço<select name="scope" value={accountScope} onChange={event => setAccountScope(event.target.value as typeof accountScope)}><option value="individual">Individual · minha conta</option><option value="shared">Conjunta · do casal</option></select></label>
          <div className="form-row"><label>Saldo inicial (R$)<input name="opening" inputMode="decimal" defaultValue="0,00" disabled={accountScope === "shared"} required /></label>
            <label>Data do saldo<input name="opening_on" type="date" defaultValue={localToday()} max={localToday()} required /></label></div>
          <Button variant="outline" disabled={busy}>{busy ? "Salvando…" : "Criar conta"}</Button>
          <p className="footnote">Uma conta conjunta nova começa em zero. Contas existentes preservam o saldo já registrado.</p>
        </form>
      </section>
    </div>
    <section className="panel mt-6"><h2>Histórico de movimentações</h2>
      <div className="form-stack mt-4">
        <div className="form-row">
          <label>Mês do histórico<input type="month" value={month} onChange={event => setMonth(event.target.value)} /></label>
          <label>Filtrar por conta<select value={filterAccount} onChange={event => setFilterAccount(event.target.value)}><option value="">Todas as contas</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        </div>
        <label>Filtrar por tipo<select value={filterKind} onChange={event => setFilterKind(event.target.value)}><option value="">Todos os tipos</option><option value="income">Receitas</option><option value="expense">Despesas</option><option value="transfer">Transferências</option></select></label>
        <Button type="button" variant="ghost" onClick={() => { setMonth(""); setFilterAccount(""); setFilterKind(""); }}>Ver todo o histórico</Button>
      </div>
      <p className="footnote">{filteredEntries.length} movimentações neste filtro, incluindo reversões. Os saldos acima representam todas as movimentações.</p>
      {!filteredEntries.length ? <Empty>Nenhuma movimentação encontrada neste filtro.</Empty> : <ul className="entry-list">{filteredEntries.map(entry => <li className={entry.reversed_at ? "reversed" : ""} key={entry.id}>
        <div><strong>{entry.description}</strong><small>{entry.occurred_on.split("-").reverse().join("/")} · {names[entry.owner_id] ?? "Participante"} · {entry.kind === "transfer" ? "Transferência" : entry.kind === "income" ? "Receita" : "Despesa"}</small>
          <small>{entry.source_account_id ? accountMap.get(entry.source_account_id)?.name ?? "Conta" : "Origem externa"} → {entry.destination_account_id ? accountMap.get(entry.destination_account_id)?.name ?? "Conta" : "Destino externo"}</small>
          <span>{moneyFromCents(entry.amount_cents)}</span></div>
        {entry.reversed_at ? <small>Revertida</small> : entry.owner_id === userId || entry.scope === "shared" ?
          <Button type="button" variant="ghost" disabled={busy} onClick={() => reverseEntry(entry)}>Reverter</Button> : <small>Somente leitura</small>}
      </li>)}</ul>}
    </section>
  </>;
}
