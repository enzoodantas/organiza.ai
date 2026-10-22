"use client";
import { useState, type FormEvent } from "react";
import { useDemo } from "./demo-provider";
import { challengeProgress, challengeTotalCents } from "@/domain/challenge";
import { money } from "@/domain/finance";
import { Button } from "./ui/button";
import { Empty, PageHeading, Progress } from "./primitives";

export function ChallengeView() {
  const { contributions, actor, addContribution, reverseContribution } = useDemo();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const activeNumbers = new Set(contributions.filter(c => !c.reversed).map(c => c.number));
  const saved = challengeProgress(contributions);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const number = Number(selected);
    if (!Number.isInteger(number) || number < 1 || number > 200) {
      setError("Escolha um número de 1 a 200.");
      return;
    }
    if (activeNumbers.has(number)) {
      setError("Este número já recebeu um aporte.");
      return;
    }
    try {
      addContribution(number);
      setSelected("");
      setMessage(`Aporte fictício de ${money(number * 100)} registrado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o aporte.");
    }
  }

  return <>
    <PageHeading eyebrow="NOSSO SIM, UM PASSO POR VEZ" title="Desafio dos R$ 20.100" description="200 números. Um objetivo compartilhado: preparar o nosso casamento." />
    <section className="panel">
      <div className="goal-value"><strong>{money(saved)}</strong><span>de {money(challengeTotalCents)}</span></div>
      <Progress value={saved / challengeTotalCents * 100} label="Progresso conjunto" />
      <div className="participant-progress"><span>Enzo: <strong>{money(challengeProgress(contributions, "a"))}</strong></span><span>Letícia: <strong>{money(challengeProgress(contributions, "b"))}</strong></span><span>{activeNumbers.size}/200 números</span></div>
      <p className="footnote">Nesta demonstração, o aporte simula a reserva de dinheiro já existente. Ele não cria uma nova receita e não altera o resultado das movimentações. Os números voltam ao estado inicial após recarregar a página.</p>
    </section>
    <div className="finance-columns mt-6">
      <section className="panel"><h2>O mapa do nosso objetivo</h2><p className="muted mb-5">Cada número vale seu valor em reais. Escolha um disponível na grade ou digite abaixo. Verde indica um aporte ativo.</p>
        <div className="number-grid">{Array.from({ length: 200 }, (_, i) => i + 1).map(n => <button key={n} type="button" className={`${activeNumbers.has(n) ? "filled" : ""} ${selected === String(n) ? "selected" : ""}`} disabled={activeNumbers.has(n)} aria-label={`${n} reais: ${activeNumbers.has(n) ? "preenchido" : "selecionar"}`} aria-pressed={selected === String(n)} onClick={() => { setSelected(String(n)); setError(""); setMessage(""); }}>{n}</button>)}</div>
      </section>
      <div className="space-y-6">
        <section className="panel"><h2>Reservar um número</h2><form className="form-stack" onSubmit={submit}><label>Número de 1 a 200<input name="number" type="number" min={1} max={200} step={1} required inputMode="numeric" value={selected} onChange={e => setSelected(e.target.value)} /></label><p className="muted">Responsável: {actor === "a" ? "Enzo" : "Letícia"}. O número escolhido determina o aporte em reais.</p>{error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}<Button>Registrar aporte fictício</Button></form></section>
        <section className="panel"><h2>Histórico de aportes</h2>{!contributions.length ? <Empty>A jornada começa com o primeiro aporte.</Empty> : <ul className="contribution-list">{[...contributions].reverse().map(c => <li key={c.id}><div><strong>{money(c.number * 100)}</strong><small>{c.participantId === "a" ? "Enzo" : "Letícia"} · {c.date.split("-").reverse().join("/")}</small></div>{c.reversed ? <small>Revertido</small> : <Button variant="ghost" aria-label={`Reverter aporte ${c.number}`} onClick={() => reverseContribution(c.id)}>Reverter</Button>}</li>)}</ul>}</section>
      </div>
    </div>
  </>;
}
