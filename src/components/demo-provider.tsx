"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { demoContributions, demoEntries, demoMembers, demoRelationshipId } from "@/lib/demo/data";
import { canWrite, cents, type Entry } from "@/domain/finance";
import { contribute, type Contribution } from "@/domain/challenge";
interface DemoState {
  entries: Entry[]; contributions: Contribution[]; actor: string;
  setActor: (id: string) => void; addEntry: (entry: Pick<Entry, "amountCents" | "kind" | "scope" | "description">) => void;
  reverseEntry: (id: string) => void; addContribution: (number: number) => void; reverseContribution: (id: string) => void;
}
const Context = createContext<DemoState | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState(demoEntries);
  const [contributions, setContributions] = useState(demoContributions);
  const [actor, setActor] = useState("a");
  const value: DemoState = { entries, contributions, actor, setActor,
    addEntry(input) {
      cents(input.amountCents);
      if (!input.description.trim() || input.description.length > 120) throw new Error("Descreva a movimentação em até 120 caracteres.");
      const entry: Entry = { ...input, description: input.description.trim(), id: crypto.randomUUID(), relationshipId: demoRelationshipId, ownerId: actor, date: new Date().toISOString().slice(0, 10), reversed: false };
      if (!canWrite(entry, actor, demoMembers)) throw new Error("Acesso negado.");
      setEntries(items => [entry, ...items]);
    },
    reverseEntry(id) { setEntries(items => items.map(e => e.id === id && canWrite(e, actor, demoMembers) ? { ...e, reversed: true } : e)); },
    addContribution(number) { setContributions(items => [...items, contribute(items, number, actor, crypto.randomUUID(), new Date().toISOString().slice(0, 10))]); },
    reverseContribution(id) { setContributions(items => items.map(c => c.id === id ? { ...c, reversed: true } : c)); }
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDemo() { const state = useContext(Context); if (!state) throw new Error("DemoProvider ausente"); return state; }
