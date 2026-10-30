"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/client";
import type { MascotPerson, OwnedItem, WardrobeItem } from "@/lib/mascots";
import { Mascot } from "./mascot";
import { Button } from "./ui/button";

type Mutation = { kind: "species"; species: "cat" | "dog" } | { kind: "review" } | { kind: "buy"; item: string } | { kind: "equip"; item: string; wear: boolean };

export function MascotWardrobe({ userId, people, catalog, owned, coins, xp, reviewed }: {
  userId: string; people: MascotPerson[]; catalog: WardrobeItem[]; owned: OwnedItem[];
  coins: number; xp: number; reviewed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmItem, setConfirmItem] = useState<string | null>(null);
  const [reviewChecked, setReviewChecked] = useState(false);
  const me = people.find(person => person.id === userId);

  function mutate(action: Mutation) {
    setMessage(""); setError("");
    startTransition(async () => {
      try {
        const client = browserClient();
        const result = action.kind === "species" ? await client.rpc("select_mascot", { target_species: action.species })
          : action.kind === "review" ? await client.rpc("complete_mascot_review")
          : action.kind === "buy" ? await client.rpc("buy_mascot_item", { target_item: action.item })
          : await client.rpc("equip_mascot_item", { target_item: action.item, wear: action.wear });
        if (result.error) {
          setError(result.error.code === "23514" ? result.error.message : "Não foi possível salvar. Atualize e tente novamente.");
          return;
        }
        setMessage(action.kind === "species" ? "Mascote atualizado. Suas roupas e conquistas continuam com você."
          : action.kind === "review" ? result.data === false ? "Sua revisão desta semana já foi reconhecida." : "Cuidado reconhecido: +5 moedas e +20 XP!"
          : action.kind === "buy" ? result.data === false ? "Essa peça já está no seu guarda-roupa." : "Peça comprada com moedas virtuais! Agora você pode vestir."
          : action.wear ? "Pronto! Seu mascote está de roupa nova." : "Peça guardada. Ela continua sua.");
        setConfirmItem(null);
        router.refresh();
      } catch { setError("A conexão falhou. Atualize para conferir se a ação foi salva antes de tentar novamente."); }
    });
  }

  return <>
    {message && <p role="status" className="prepared-note mb-4">{message}</p>}
    {error && <p role="alert" className="form-error mb-4">{error}</p>}
    <div className="mascot-cards">{people.map(person => <section className="panel mascot-profile" key={person.id}>
      <span className="small-tag">{person.id === userId ? "SEU COMPANHEIRO" : "NA MESMA JORNADA"}</span>
      <Mascot animal={person.mascot} name={person.display_name} items={person.items} />
      <h2>{person.display_name}</h2>
      {person.id === userId ? <div className="form-stack mt-4"><label htmlFor="mascot-species">Seu mascote</label><select id="mascot-species" disabled={pending} value={me?.mascot} onChange={event => mutate({ kind: "species", species: event.target.value as "cat" | "dog" })}><option value="cat">Gato</option><option value="dog">Cachorro</option></select><p className="footnote">A escolha é sua. Vocês podem usar a mesma espécie; roupas, moedas e XP são preservados.</p></div> : <p className="muted mt-3">Cada pessoa cuida do próprio mascote.</p>}
    </section>)}</div>
    <section className="panel mt-6" aria-labelledby="review-title">
      <span className="small-tag">UM CUIDADO POR SEMANA</span><h2 id="review-title" className="mt-3">Planejar também merece carinho.</h2>
      <p className="muted mt-3">Confira as estimativas, converse sobre o que mudou e reconheça esse cuidado. A revisão é uma confirmação sua, sem meta de gasto ou de economia.</p>
      <div className="wardrobe-balance"><strong>{coins} moedas virtuais</strong><span>Nível {Math.floor(xp / 100) + 1} · {xp} XP</span></div>
      <p className="footnote">Uma revisão por semana, de segunda a domingo no horário de Brasília: +5 moedas e +20 XP. Sem perda de sequência ou punição por pausas.</p>
      <Link className="inline-block underline mt-4" href="/planejamento">Abrir planejamento</Link>
      {reviewed ? <p className="prepared-note mt-4">Sua revisão desta semana já foi reconhecida. Volte no seu ritmo na próxima semana.</p> : <div className="form-stack mt-4"><label className="review-check"><input type="checkbox" checked={reviewChecked} onChange={event => setReviewChecked(event.target.checked)} disabled={pending} />Revisei nosso planejamento nesta semana.</label><Button disabled={pending || !reviewChecked} onClick={() => mutate({ kind: "review" })}>Reconhecer revisão semanal</Button></div>}
    </section>
    <section className="panel mt-6" aria-labelledby="wardrobe-title"><span className="small-tag">PEQUENAS CONQUISTAS</span><h2 className="mt-3" id="wardrobe-title">Seu guarda-roupa</h2><p className="muted mt-3">Peças para os dois tipos de mascote. Vista uma roupa e um chapéu por vez.</p>
      <div className="wardrobe-grid mt-6">{catalog.map(item => {
        const mine = owned.find(row => row.item_id === item.id);
        return <article className="wardrobe-item" key={item.id}><Mascot animal={me?.mascot ?? "cat"} items={[item.id]} /><h3>{item.name}</h3><p className="footnote">{item.slot === "hat" ? "Chapéu" : "Roupa"} · {mine ? "No seu guarda-roupa" : `${item.price} moedas virtuais`}</p>
          {mine ? <Button variant="outline" disabled={pending} onClick={() => mutate({ kind: "equip", item: item.id, wear: !mine.equipped })}>{mine.equipped ? "Guardar" : "Vestir"}<span className="sr-only"> {item.name}</span></Button>
            : confirmItem === item.id ? <div className="form-stack"><p>Usar {item.price} moedas nesta peça?</p><Button disabled={pending} onClick={() => mutate({ kind: "buy", item: item.id })}>Confirmar compra<span className="sr-only"> {item.name}</span></Button><Button variant="ghost" disabled={pending} onClick={() => setConfirmItem(null)}>Cancelar</Button></div>
            : <Button variant="outline" disabled={pending || coins < item.price} onClick={() => setConfirmItem(item.id)}>Comprar<span className="sr-only"> {item.name}</span></Button>}
        </article>;
      })}</div>
      <p className="footnote mt-6">Moedas são apenas virtuais: não usam seu saldo financeiro, não podem ser compradas com dinheiro, transferidas ou sacadas. As peças são cosméticas e não dão vantagens financeiras.</p>
    </section>
  </>;
}
