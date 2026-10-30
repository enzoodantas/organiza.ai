export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isLocalSupabase() {
  const config = supabaseConfig();
  if (!config) return false;
  try { return ["127.0.0.1", "localhost", "[::1]"].includes(new URL(config.url).hostname); }
  catch { return false; }
}
