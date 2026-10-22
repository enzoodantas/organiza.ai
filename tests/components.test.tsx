import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DemoProvider } from "@/components/demo-provider";
import { FinanceView } from "@/components/finance-view";
import { ChallengeView } from "@/components/challenge-view";
describe("fluxos críticos da demonstração", () => {
  it("apresenta erro para dinheiro inválido e registra centavos válidos", () => {
    render(<DemoProvider><FinanceView /></DemoProvider>);
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Café de teste" } });
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "1,234" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à demonstração/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use um valor");
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "12,50" } });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar à demonstração/ }));
    expect(screen.getByText("Café de teste")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("somente à demonstração");
    fireEvent.click(screen.getByRole("button", { name: "Reverter Café de teste" }));
    expect(screen.getByText("Revertido")).toBeVisible();
  });
  it("bloqueia aporte duplicado e atualiza progresso sem alterar receitas", () => {
    render(<DemoProvider><ChallengeView /></DemoProvider>);
    fireEvent.click(screen.getByRole("button", { name: "1 reais: selecionar" }));
    expect(screen.getByLabelText("Número de 1 a 200")).toHaveValue(1);
    fireEvent.change(screen.getByLabelText("Número de 1 a 200"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar aporte fictício" }));
    expect(screen.getByRole("alert")).toHaveTextContent("já recebeu");
    fireEvent.change(screen.getByLabelText("Número de 1 a 200"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar aporte fictício" }));
    expect(screen.getByRole("status")).toHaveTextContent("registrado");
    expect(screen.getByText("9/200 números")).toBeVisible();
    expect(screen.getByRole("button", { name: "1 reais: preenchido" })).toBeDisabled();
  });
});
