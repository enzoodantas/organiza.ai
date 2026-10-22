import { describe, expect, it } from "vitest";
import { canRead, canWrite, cents, money, parseMoney, summarize, type Entry } from "@/domain/finance";
import { challengeProgress, challengeTotalCents, contribute } from "@/domain/challenge";
import { evaluateReward } from "@/domain/rewards";
const base: Entry = { id: "one", relationshipId: "couple-1", ownerId: "a", scope: "individual", kind: "income", amountCents: 10000, description: "Teste", date: "2026-10-01", reversed: false };
const members = [{ userId: "a", relationshipId: "couple-1", active: true }, { userId: "b", relationshipId: "couple-1", active: true }, { userId: "c", relationshipId: "couple-2", active: true }];
describe("dinheiro em centavos", () => {
  it("converte decimal sem acumular ponto flutuante", () => { expect(parseMoney("0,10") + parseMoney("0.20")).toBe(30); expect(parseMoney("123,4")).toBe(12340); });
  it.each(["", "1.000,00", "-3", "NaN", "1,234", "1e5", "0", "Infinity"])("rejeita valor ambíguo/inválido %s", value => expect(() => parseMoney(value)).toThrow());
  it.each([0, -1, 1.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 10000000001])("rejeita centavos inválidos %s", value => expect(() => cents(value)).toThrow());
  it("ignora transferências, reservas e reversões nos resultados consolidados", () => {
    expect(summarize([base, { ...base, id: "two", kind: "expense", amountCents: 3000 }, { ...base, kind: "transfer", amountCents: 5000 }, { ...base, kind: "allocation", amountCents: 2000 }, { ...base, reversed: true }])).toEqual({ income: 10000, expense: 3000, balance: 7000 });
  });
  it("rejeita agregação e formatação sem precisão inteira", () => {
    const amountCents = 10_000_000_000;
    const many = Array(900720).fill({ ...base, amountCents }) as Entry[];
    expect(() => summarize(many)).toThrow("limite de precisão");
    expect(() => money(Number.MAX_SAFE_INTEGER + 1)).toThrow("limite de precisão");
    expect(money(Number.MAX_SAFE_INTEGER)).toBe("R$ 90.071.992.547.409,91");
    expect(money(-1)).toBe("-R$ 0,01");
  });
});
describe("política de domínio (não substitui RLS)", () => {
  it("permite leitura individual pelo parceiro mas só o dono escreve", () => { expect(canRead(base, "b", members)).toBe(true); expect(canWrite(base, "b", members)).toBe(false); expect(canWrite(base, "a", members)).toBe(true); });
  it("permite escrita compartilhada pelo parceiro", () => expect(canWrite({ ...base, scope: "shared" }, "b", members)).toBe(true));
  it("isola outros casais e desconhecidos", () => { for (const user of ["c", "unknown"]) { expect(canRead(base, user, members)).toBe(false); expect(canWrite({ ...base, scope: "shared" }, user, members)).toBe(false); } });
  it("nega vínculo revogado mesmo ao proprietário", () => { expect(canRead(base, "a", [{ ...members[0]!, active: false }])).toBe(false); });
});
describe("campanha e reversões", () => {
  it("totaliza exatamente R$ 20.100", () => expect(Array.from({ length: 200 }, (_, i) => (i + 1) * 100).reduce((a, b) => a + b, 0)).toBe(challengeTotalCents));
  it("bloqueia duplicidade e reabre slot revertido com histórico preservado", () => { const c = contribute([], 20, "a", "1", "2026-10-01"); expect(() => contribute([c], 20, "b", "2", "2026-10-01")).toThrow(); const reversed = { ...c, reversed: true }; const next = contribute([reversed], 20, "b", "2", "2026-10-02"); expect(challengeProgress([reversed, next])).toBe(2000); expect(challengeProgress([reversed, next], "a")).toBe(0); expect(challengeProgress([reversed, next], "b")).toBe(2000); });
  it.each([0, 201, 1.5, NaN])("nega número inválido %s", number => expect(() => contribute([], number, "a", "1", "today")).toThrow());
});
describe("motor de recompensas", () => {
  it("deduplica a mesma origem canônica", () => { const reward = evaluateReward("weekly_review", "a:2026-W43", []); expect(reward?.xp).toBe(20); expect(evaluateReward("weekly_review", "a:2026-W43", [reward!.key])).toBeNull(); });
  it("permite regras configuradas sem dependência da UI ou dinheiro real", () => expect(evaluateReward("first_entry", "a:first", [], [{ event: "first_entry", xp: 3, coins: 1 }])).toMatchObject({ xp: 3, coins: 1 }));
});
