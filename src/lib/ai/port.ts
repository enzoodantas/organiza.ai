import type { EntryKind } from "@/domain/finance";
// Um adaptador futuro apenas propõe; confirmação, autorização e persistência são externas.
export interface FinancialProposal { kind: EntryKind; amountCents: number; description: string; requiresConfirmation: true }
export interface FinancialInterpreter { interpret(transcript: string): Promise<FinancialProposal> }
