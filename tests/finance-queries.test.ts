import { describe, expect, it } from "vitest";
import { collectPages } from "@/lib/finance/queries";

describe("histórico financeiro completo", () => {
  it("lê além dos antigos limites mesmo com limite menor no servidor", async () => {
    const history = Array.from({ length: 503 }, (_, id) => ({ id, amount_cents: 101 }));
    const result = await collectPages(async (from, to) => ({
      data: history.slice(from, Math.min(to + 1, from + 75)), error: null,
    }));
    expect(result.error).toBeNull();
    expect(result.data).toEqual(history);
    expect(result.data.reduce((sum, item) => sum + item.amount_cents, 0)).toBe(50803);
  });

  it("não apresenta totais parciais quando uma página falha", async () => {
    const result = await collectPages(async from => from === 0
      ? { data: [{ id: 1 }], error: null }
      : { data: null, error: { message: "Sessão expirada" } });
    expect(result.data).toEqual([]);
    expect(result.error?.message).toBe("Sessão expirada");
  });

  it("recusa páginas sobrepostas para não duplicar dinheiro após inserção concorrente", async () => {
    const result = await collectPages(async () => ({ data: [{ id: "same" }], error: null }));
    expect(result.data).toEqual([]);
    expect(result.error?.message).toContain("histórico mudou");
  });
});
