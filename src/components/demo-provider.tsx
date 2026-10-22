"use client";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { demoContributions, demoEntries, demoMembers, demoRelationshipId } from "@/lib/demo/data";
import { canWrite, cents, type Entry } from "@/domain/finance";
import { contribute, type Contribution } from "@/domain/challenge";
interface DemoState {
  entries: Entry[]; contributions: Contribution[]; actor: string;
  setActor: (id: string) => void; addEntry: (entry: Pick<Entry, "amountCents" | "kind" | "scope" | "description">) => void;
  reverseEntry: (id: string) => void; addContribution: (number: number) => void; reverseContribution: (id: string) => void;
}
const Context = createContext<DemoState | null>(null);
function todayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState(demoEntries);
  const [contributions, setContributions] = useState(demoContributions);
  const contributionsRef = useRef(contributions);
  const [actor, setActor] = useState("a");
  const value: DemoState = { entries, contributions, actor, setActor,
    addEntry(input) {
      cents(input.amountCents);
      if (input.kind !== "income" && input.kind !== "expense") throw new Error("Tipo de movimentação indisponível nesta demonstração.");
      if (input.scope !== "individual" && input.scope !== "shared") throw new Error("Espaço financeiro inválido.");
      if (!input.description.trim() || input.description.length > 120) throw new Error("Descreva a movimentação em até 120 caracteres.");
      const entry: Entry = { ...input, description: input.description.trim(), id: crypto.randomUUID(), relationshipId: demoRelationshipId, ownerId: actor, date: todayLocal(), reversed: false };
      if (!canWrite(entry, actor, demoMembers)) throw new Error("Acesso negado.");
      setEntries(items => [entry, ...items]);
    },
    reverseEntry(id) { setEntries(items => items.map(e => e.id === id && canWrite(e, actor, demoMembers) ? { ...e, reversed: true } : e)); },
    addContribution(number) {
      const next = [...contributionsRef.current, contribute(contributionsRef.current, number, actor, crypto.randomUUID(), todayLocal())];
      contributionsRef.current = next;
      setContributions(next);
    },
    reverseContribution(id) {
      const next = contributionsRef.current.map(c => c.id === id ? { ...c, reversed: true } : c);
      contributionsRef.current = next;
      setContributions(next);
    }
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDemo() { const state = useContext(Context); if (!state) throw new Error("DemoProvider ausente"); return state; }
