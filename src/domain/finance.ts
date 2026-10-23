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
function safeSum(values: number[]): number {
  return values.reduce((sum, value) => {
    cents(value);
    const next = sum + value;
    if (!Number.isSafeInteger(next)) throw new Error("Total fora do limite de precisão. Use agregação inteira no banco.");
    return next;
  }, 0);
}
export function parseMoney(input: string): number {
  if (!/^\d{1,9}([,.]\d{1,2})?$/.test(input.trim())) throw new Error("Use um valor como 120,50, sem separador de milhar.");
  const [whole = "0", decimal = ""] = input.trim().replace(",", ".").split(".");
  return cents(Number(whole) * 100 + Number(decimal.padEnd(2, "0")));
}
export const money = (value: number) => {
  if (!Number.isSafeInteger(value)) throw new Error("Valor fora do limite de precisão.");
  const absolute = BigInt(Math.abs(value));
  const reais = new Intl.NumberFormat("pt-BR").format(absolute / 100n);
  const centavos = String(absolute % 100n).padStart(2, "0");
  return `${value < 0 ? "-" : ""}R$ ${reais},${centavos}`;
};
export function moneyFromCents(value: string | number | bigint): string {
  const centsValue = BigInt(value);
  const absolute = centsValue < 0n ? -centsValue : centsValue;
  const reais = new Intl.NumberFormat("pt-BR").format(absolute / 100n);
  return `${centsValue < 0n ? "-" : ""}R$ ${reais},${String(absolute % 100n).padStart(2, "0")}`;
}
export function summarize(entries: Entry[]) {
  const active = entries.filter(e => !e.reversed);
  const income = safeSum(active.filter(e => e.kind === "income").map(e => e.amountCents));
  const expense = safeSum(active.filter(e => e.kind === "expense").map(e => e.amountCents));
  return { income, expense, balance: income - expense };
}
export interface Membership { userId: string; relationshipId: string; active: boolean }
export function canRead(entry: Entry, userId: string, members: Membership[]) {
  return members.some(m => m.userId === userId && m.relationshipId === entry.relationshipId && m.active);
}
export function canWrite(entry: Entry, userId: string, members: Membership[]) {
  return canRead(entry, userId, members) && (entry.scope === "shared" || entry.ownerId === userId);
}
