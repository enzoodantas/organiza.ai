import { cents } from "./finance";
export interface Contribution { id: string; number: number; participantId: string; reversed: boolean; date: string }
export const challengeTotalCents = 2_010_000;
export function contribute(current: Contribution[], number: number, participantId: string, id: string, date: string): Contribution {
  if (!Number.isInteger(number) || number < 1 || number > 200) throw new Error("Escolha um número de 1 a 200.");
  cents(number * 100);
  if (current.some(c => c.number === number && !c.reversed)) throw new Error("Este número já recebeu um aporte.");
  return { id, number, participantId, reversed: false, date };
}
export function challengeProgress(items: Contribution[], participantId?: string) {
  return items.filter(c => !c.reversed && (!participantId || c.participantId === participantId)).reduce((sum, c) => sum + c.number * 100, 0);
}
