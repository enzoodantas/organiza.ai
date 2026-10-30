"use client";
import type { AppDatabase } from "@/lib/supabase/types";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";
export function browserClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase ainda não configurado.");
  return createBrowserClient<AppDatabase>(config.url, config.key);
}
