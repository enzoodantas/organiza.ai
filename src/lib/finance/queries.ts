import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppDatabase } from "@/lib/supabase/types";

// Never present a partial page as the complete financial history.
// Continue even if the server's configured row limit is lower than our page size.
export async function collectPages<T extends { id: string | number }>(fetchPage: (from: number, to: number) => PromiseLike<{
  data: T[] | null; error: { message: string } | null;
}>): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  const seen = new Set<string | number>();
  while (true) {
    const result = await fetchPage(rows.length, rows.length + 199);
    if (result.error) return { data: [], error: result.error };
    if (!result.data?.length) return { data: rows, error: null };
    for (const row of result.data) {
      if (seen.has(row.id)) return { data: [], error: {
        message: "O histórico mudou durante a leitura. Atualize a página.",
      } };
      seen.add(row.id);
    }
    rows.push(...result.data);
  }
}

export function listEntries(client: SupabaseClient<AppDatabase>, relationshipId: string) {
  return collectPages((from, to) => client.from("financial_entries")
    .select("id,owner_id,scope,kind,amount_cents,source_account_id,destination_account_id,description,occurred_on,reversed_at,created_at")
    .eq("relationship_id", relationshipId)
    .order("occurred_on", { ascending: false }).order("created_at", { ascending: false })
    .order("id", { ascending: false }).range(from, to));
}

export function listContributions(client: SupabaseClient<AppDatabase>, relationshipId: string) {
  return collectPages((from, to) => client.from("contributions")
    .select("id,participant_id,source_account_id,slot,amount_cents,reversed_at,created_at")
    .eq("relationship_id", relationshipId)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to));
}
