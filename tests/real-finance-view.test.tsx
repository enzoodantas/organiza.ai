import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RealFinanceView } from "@/components/real-finance-view";
import { RealDashboard } from "@/components/real-dashboard";
import type { FinancialEntry } from "@/lib/finance/records";

const entries: FinancialEntry[] = [
  { id: "1", owner_id: "a", scope: "individual", kind: "income", amount_cents: 10000,
    source_account_id: null, destination_account_id: "account-a", description: "Entrada janeiro",
    occurred_on: "2026-01-31", reversed_at: null, created_at: "2026-01-31T12:00:00Z" },
  { id: "2", owner_id: "a", scope: "shared", kind: "transfer", amount_cents: 5000,
    source_account_id: "account-a", destination_account_id: "account-b", description: "Transferência fevereiro",
    occurred_on: "2026-02-01", reversed_at: null, created_at: "2026-02-01T12:00:00Z" },
  { id: "3", owner_id: "a", scope: "individual", kind: "expense", amount_cents: 2000,
    source_account_id: "account-a", destination_account_id: null, description: "Despesa revertida",
    occurred_on: "2026-01-31", reversed_at: "2026-02-01", created_at: "2026-01-31T12:00:00Z" },
];

describe("consulta financeira por período", () => {
  it("filtra mês e conta, encontra o destino das transferências e preserva reversões", () => {
    render(<RealFinanceView relationshipId="r" userId="a" names={{ a: "Pessoa" }}
      initialAccounts={[{ id: "account-b", owner_id: null, scope: "shared", name: "Conjunta" }]}
      initialPositions={[]} initialEntries={entries} initialOpening={[]} />);
    fireEvent.change(screen.getByLabelText("Mês do histórico"), { target: { value: "2026-01" } });
    expect(screen.getByText("Entrada janeiro")).toBeVisible();
    expect(screen.getByText("Despesa revertida")).toBeVisible();
    expect(screen.queryByText("Transferência fevereiro")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver todo o histórico" }));
    fireEvent.change(screen.getByLabelText("Filtrar por conta"), { target: { value: "account-b" } });
    expect(screen.getByText("Transferência fevereiro")).toBeVisible();
    expect(screen.queryByText("Entrada janeiro")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por tipo"), { target: { value: "expense" } });
    expect(screen.getByText("Nenhuma movimentação encontrada neste filtro.")).toBeVisible();
  });

  it("não conta transferências nem reversões como receita/despesa do mês", () => {
    const { container } = render(<RealDashboard positions={[]} entries={entries} contributions={[]} />);
    fireEvent.change(screen.getByLabelText("Mês das receitas e despesas"), { target: { value: "2026-01" } });
    const cards = container.querySelectorAll(".stat-card strong");
    expect(cards[1]).toHaveTextContent(/100,00/);
    expect(cards[2]).toHaveTextContent(/0,00/);
    fireEvent.change(screen.getByLabelText("Mês das receitas e despesas"), { target: { value: "2026-02" } });
    expect(cards[1]).toHaveTextContent(/0,00/);
    expect(cards[2]).toHaveTextContent(/0,00/);
  });
});
