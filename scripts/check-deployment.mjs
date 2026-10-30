import { pathToFileURL } from "node:url";

export function deploymentConfig(env = process.env) {
  let backend;
  let app;
  try {
    backend = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    app = new URL(env.APP_URL);
  } catch { throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e APP_URL com URLs HTTPS públicas."); }
  if (!/^[a-z0-9]{20}\.supabase\.co$/.test(backend.hostname) || backend.protocol !== "https:" ||
      backend.username || backend.password || backend.search || backend.hash || backend.pathname !== "/")
    throw new Error("O deploy exige a URL HTTPS de um projeto Supabase hospedado.");
  if (app.protocol !== "https:" || !app.hostname.includes(".") ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(app.hostname) ||
      app.hostname.endsWith(".local") || app.hostname.endsWith(".localhost") ||
      app.username || app.password || app.search || app.hash || app.pathname !== "/")
    throw new Error("APP_URL deve ser a origem HTTPS pública do aplicativo.");
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicKey && key.split(".").length === 3) {
    try {
      const claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
      publicKey = claims.role === "anon" && claims.ref === backend.hostname.split(".")[0];
    } catch { /* Invalid JWT. Never print its contents. */ }
  }
  if (!publicKey) throw new Error("Use somente a publishable key ou a chave anon do mesmo projeto; chaves administrativas são recusadas.");
  return { backend: backend.origin, app: app.origin, key };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = deploymentConfig();
    const response = await fetch(`${config.backend}/auth/v1/health`, {
      headers: { apikey: config.key }, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`O Auth remoto não está disponível (HTTP ${response.status}).`);
    console.log("URLs e chave pública válidas; Auth remoto acessível. Migrações, SMTP e login ainda exigem validação.");
  } catch (error) {
    console.error(error instanceof Error && error.message !== "fetch failed" ? error.message : "Não foi possível acessar o Auth remoto.");
    process.exitCode = 1;
  }
}
