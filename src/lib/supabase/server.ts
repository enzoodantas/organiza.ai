import type { AppDatabase } from "@/lib/supabase/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";
export async function serverClient() {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient<AppDatabase>(config.url, config.key, { cookies: {
    getAll: () => store.getAll(),
    setAll(items) {
      try { items.forEach(({ name, value, options }) => store.set(name, value, options)); }
      catch {
        // Server Components só leem cookies. O proxy renova a sessão nessas rotas;
        // em Server Actions, store.set escreve os cookies normalmente.
      }
    }
  } });
}
