import type { Entry, Membership } from "@/domain/finance";
import type { Contribution } from "@/domain/challenge";
export const demoRelationshipId = "demo-couple";
export const demoMembers: Membership[] = ["a", "b"].map(userId => ({ userId, relationshipId: demoRelationshipId, active: true }));
export const demoEntries: Entry[] = [
  { id: "1", relationshipId: demoRelationshipId, ownerId: "a", scope: "individual", kind: "income", amountCents: 480000, description: "Receita de exemplo • Enzo", date: "2026-10-05", reversed: false },
  { id: "2", relationshipId: demoRelationshipId, ownerId: "b", scope: "individual", kind: "income", amountCents: 420000, description: "Receita de exemplo • Letícia", date: "2026-10-05", reversed: false },
  { id: "3", relationshipId: demoRelationshipId, ownerId: "a", scope: "shared", kind: "expense", amountCents: 180000, description: "Moradia de exemplo", date: "2026-10-10", reversed: false },
  { id: "4", relationshipId: demoRelationshipId, ownerId: "b", scope: "shared", kind: "expense", amountCents: 65000, description: "Mercado de exemplo", date: "2026-10-18", reversed: false }
];
export const demoContributions: Contribution[] = [10, 20, 30, 40, 50, 100, 150, 200].map((number, index) => ({ id: `c${number}`, number, participantId: index % 2 ? "a" : "b", reversed: false, date: "2026-10-18" }));
