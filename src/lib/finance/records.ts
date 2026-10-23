export type FinancialAccount = {
  id: string;
  owner_id: string | null;
  name: string;
  scope: "individual" | "shared";
};

export type AccountPosition = {
  account_id: string;
  balance_cents: string;
  reserved_cents: string;
  available_cents: string;
};

export type FinancialEntry = {
  id: string;
  owner_id: string;
  scope: "individual" | "shared";
  kind: "income" | "expense" | "transfer";
  amount_cents: number;
  source_account_id: string | null;
  destination_account_id: string | null;
  description: string;
  occurred_on: string;
  reversed_at: string | null;
  created_at: string;
};

export type NumberContribution = {
  id: string;
  participant_id: string;
  source_account_id: string;
  slot: number;
  amount_cents: number;
  reversed_at: string | null;
  created_at: string;
};

export type OpeningBalance = {
  account_id: string;
  amount_cents: number;
  noted_on: string;
};

export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
