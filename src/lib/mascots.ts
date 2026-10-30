import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppDatabase } from "./supabase/types";

export type MascotPerson = { id: string; display_name: string; mascot: "cat" | "dog"; items: string[] };
export type WardrobeItem = { id: string; name: string; slot: string; price: number };
export type OwnedItem = { item_id: string; equipped: boolean };

export async function loadMascotPeople(client: SupabaseClient<AppDatabase>) {
  const [profiles, inventory] = await Promise.all([
    client.from("profiles").select("id,display_name,mascot").order("created_at"),
    client.from("mascot_inventory").select("user_id,item_id").eq("equipped", true),
  ]);
  if (profiles.error || inventory.error) return { people: [], error: true };
  const people: MascotPerson[] = (profiles.data ?? []).map(person => ({
    ...person, mascot: person.mascot === "dog" ? "dog" : "cat",
    items: (inventory.data ?? []).filter(item => item.user_id === person.id).map(item => item.item_id),
  }));
  return { people, error: false };
}
