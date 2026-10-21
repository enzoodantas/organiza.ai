export type EntryKind = "income" | "expense" | "transfer" | "allocation";
export type Scope = "individual" | "shared";
export interface Entry {
  id: string; relationshipId: string; ownerId: string; scope: Scope; kind: EntryKind;
  amountCents: number; description: string; date: string; reversed: boolean;
}
export function cents(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 100_000_000_00) throw new Error("Informe um valor positivo e válido em centavos.");
  return value;
}
export function parseMoney(input: string): number {
  if (!/^\d{1,9}([,.]\d{1,2})?$/.test(input.trim())) throw new Error("Use um valor como 120,50, sem separador de milhar.");
  const [whole = "0", decimal = ""] = input.trim().replace(",", ".").split(".");
  return cents(Number(whole) * 100 + Number(decimal.padEnd(2, "0")));
}
export const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
export function summarize(entries: Entry[]) {
  const active = entries.filter(e => !e.reversed);
  const income = active.filter(e => e.kind === "income").reduce((sum, e) => sum + e.amountCents, 0);
  const expense = active.filter(e => e.kind === "expense").reduce((sum, e) => sum + e.amountCents, 0);
  return { income, expense, balance: income - expense };
}
export interface Membership { userId: string; relationshipId: string; active: boolean }
export function canRead(entry: Entry, userId: string, members: Membership[]) {
  return members.some(m => m.userId === userId && m.relationshipId === entry.relationshipId && m.active);
}
export function canWrite(entry: Entry, userId: string, members: Membership[]) {
  return canRead(entry, userId, members) && (entry.scope === "shared" || entry.ownerId === userId);
}
