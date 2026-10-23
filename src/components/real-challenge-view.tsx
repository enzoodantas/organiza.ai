"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/client";
import { challengeTotalCents } from "@/domain/challenge";
import { moneyFromCents } from "@/domain/finance";
import { type AccountPosition, type FinancialAccount, type NumberContribution } from "@/lib/finance/records";
import { Button } from "./ui/button";
import { Empty, PageHeading, Progress } from "./primitives";

export function RealChallengeView({ relationshipId, userId, names,
  initialAccounts, initialPositions, initialContributions, initialCampaignId }: {
  relationshipId: string;
  userId: string;
  names: Record<string, string>;
  initialAccounts: FinancialAccount[];
  initialPositions: AccountPosition[];
  initialContributions: NumberContribution[];
  initialCampaignId: string | null;
}) {
  const [contributions, setContributions] = useState(initialContributions);
  const [positions, setPositions] = useState(initialPositions);
  const [campaignId, setCampaignId] = useState(initialCampaignId);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const writable = initialAccounts.filter(account => account.scope === "shared" || account.owner_id === userId);
  const accountMap = new Map(initialAccounts.map(account => [account.id, account]));
  const positionMap = new Map(positions.map(position => [position.account_id, position]));
  const active = contributions.filter(item => !item.reversed_at);
  const activeSlots = new Set(active.map(item => item.slot));
  const saved = active.reduce((sum, item) => sum + BigInt(item.amount_cents), 0n);

  async function refresh() {
    const supabase = browserClient();
    const [contributionsResult, positionsResult] = await Promise.all([
      supabase.from("contributions").select("id,participant_id,source_account_id,slot,amount_cents,reversed_at,created_at")
        .eq("relationship_id", relationshipId).order("created_at", { ascending: false }).limit(300),
      supabase.rpc("list_account_positions", { target_relationship: relationshipId }),
    ]);
    if (contributionsResult.error || positionsResult.error)
      throw new Error("Não foi possível atualizar a meta. Recarregue a página.");
    setContributions((contributionsResult.data ?? []) as NumberContribution[]);
    setPositions((positionsResult.data ?? []) as AccountPosition[]);
  }

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const number = Number(selected);
    if (!Number.isInteger(number) || number < 1 || number > 200) { setError("Escolha um número de 1 a 200."); return; }
    if (activeSlots.has(number)) { setError("Este número já está reservado."); return; }
    const data = new FormData(event.currentTarget);
    const source = String(data.get("source") ?? "");
    if (!writable.some(account => account.id === source)) { setError("Selecione uma conta sua ou conjunta."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const supabase = browserClient();
      let currentCampaign = campaignId;
      if (!currentCampaign) {
        const { data: created, error: campaignError } = await supabase.rpc("ensure_number_campaign", { target_relationship: relationshipId });
        if (campaignError || !created) throw new Error("Não foi possível preparar a meta. Tente novamente.");
        currentCampaign = String(created);
        setCampaignId(currentCampaign);
      }
      const fingerprint = `${currentCampaign}:${source}:${number}`;
      if (request.current?.fingerprint !== fingerprint)
        request.current = { fingerprint, key: crypto.randomUUID() };
      const { error: reserveError } = await supabase.rpc("reserve_number", {
        target_relationship: relationshipId,
        target_campaign: currentCampaign,
        source_id: source,
        selected_slot: number,
        request_key: request.current.key,
      });
      if (reserveError) {
        if (reserveError.code === "22003") throw new Error("Saldo livre insuficiente nessa conta.");
        if (reserveError.code === "23505") throw new Error("Este número já foi reservado. Atualize a página.");
        throw new Error("Não foi possível reservar o número. Confira a conta e tente novamente.");
      }
      await refresh();
      request.current = null;
      setSelected("");
      setNotice(`Número ${number} reservado. O dinheiro continua na conta e o saldo livre foi atualizado.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível reservar.");
    } finally { setBusy(false); }
  }

  async function reverse(item: NumberContribution) {
    if (busy || !window.confirm(`Reverter a reserva do número ${item.slot}? O histórico será preservado.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: reverseError } = await browserClient().rpc("reverse_number", { contribution_id: item.id });
      if (reverseError) throw new Error("Não foi possível reverter esta reserva.");
      await refresh();
      setNotice("Reserva revertida; o número está disponível novamente.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a meta.");
    } finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="NOSSO SIM, UM PASSO POR VEZ" title="Desafio dos R$ 20.100" description="Escolha números para reservar dinheiro que já está em uma conta." />
    <section className="panel">
      <div className="goal-value"><strong>{moneyFromCents(saved)}</strong><span>de {moneyFromCents(challengeTotalCents)}</span></div>
      <Progress value={Number(saved) / challengeTotalCents * 100} label="Progresso conjunto" />
      <div className="participant-progress">{Object.entries(names).map(([id, name]) => <span key={id}>{name}: <strong>{moneyFromCents(active.filter(item => item.participant_id === id).reduce((sum, item) => sum + BigInt(item.amount_cents), 0n))}</strong></span>)}<span>{activeSlots.size}/200 números</span></div>
      <p className="footnote">Reservar não cria uma receita nem retira dinheiro da conta. O valor é descontado do saldo livre em <Link href="/financas">Finanças</Link>.</p>
    </section>
    {error && <p role="alert" className="form-error mt-6">{error}</p>}
    {notice && <p role="status" className="form-success mt-6">{notice}</p>}
    <div className="finance-columns mt-6">
      <section className="panel"><h2>O mapa do nosso objetivo</h2><p className="muted mb-5">Cada número vale seu valor em reais. Verde indica uma reserva ativa.</p>
        <div className="number-grid">{Array.from({ length: 200 }, (_, index) => index + 1).map(number =>
          <button key={number} type="button" className={`${activeSlots.has(number) ? "filled" : ""} ${selected === String(number) ? "selected" : ""}`}
            disabled={activeSlots.has(number)} aria-label={`${number} reais: ${activeSlots.has(number) ? "reservado" : "selecionar"}`}
            aria-pressed={selected === String(number)} onClick={() => { setSelected(String(number)); setError(""); setNotice(""); }}>{number}</button>)}</div>
      </section>
      <div className="space-y-6">
        <section className="panel"><h2>Reservar um número</h2>
          <form className="form-stack" onSubmit={reserve}>
            <label>Número de 1 a 200<input name="number" type="number" min={1} max={200} step={1} required inputMode="numeric" value={selected} onChange={event => setSelected(event.target.value)} /></label>
            <label>Conta que guarda o dinheiro<select name="source" defaultValue="" required><option value="">Selecione</option>{writable.map(account => <option key={account.id} value={account.id}>{account.name} · livre {moneyFromCents(positionMap.get(account.id)?.available_cents ?? "0")}</option>)}</select></label>
            <Button disabled={busy || !writable.length}>{busy ? "Reservando…" : "Reservar no banco"}</Button>
            {!writable.length && <p className="footnote">Crie uma conta em <Link href="/financas">Finanças</Link> antes de reservar.</p>}
          </form>
        </section>
        <section className="panel"><h2>Histórico de reservas</h2>
          {!contributions.length ? <Empty>O primeiro número ainda não foi reservado.</Empty> :
            <ul className="contribution-list">{contributions.map(item => <li key={item.id}><div><strong>{moneyFromCents(item.amount_cents)}</strong><small>Número {item.slot} · {names[item.participant_id] ?? "Participante"} · {accountMap.get(item.source_account_id)?.name ?? "Conta"}</small></div>
              {item.reversed_at ? <small>Revertido</small> : item.participant_id === userId || accountMap.get(item.source_account_id)?.scope === "shared" ?
                <Button type="button" variant="ghost" disabled={busy} onClick={() => reverse(item)}>Reverter</Button> : <small>Somente leitura</small>}</li>)}</ul>}
        </section>
      </div>
    </div>
  </>;
}
