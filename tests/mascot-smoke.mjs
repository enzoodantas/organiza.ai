// Local only. Creates synthetic fixtures, checks RPC races and browser persistence,
// then removes every fixture. Never use personal accounts for reward tests.
import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

loadEnvFile("supabase/.env.local");
const url = process.env.SUPABASE_LOCAL_URL;
const key = process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_LOCAL_SECRET_KEY;
assert(url?.startsWith("http://127.0.0.1:") && key && secret, "Local credentials required");
const admin = createClient(url, secret, { auth: { persistSession: false } });
const member = createClient(url, key, { auth: { persistSession: false } });
const email = `wardrobe-${crypto.randomUUID()}@example.invalid`;
const password = `Local-${crypto.randomUUID()}!`;
let uid, rid, browser;
async function checked(promise) {
  const result = await promise;
  assert(!result.error, result.error?.code ?? "Request failed");
  return result.data;
}
try {
  const created = await checked(admin.auth.admin.createUser({ email, password, email_confirm: true }));
  uid = created.user.id;
  await checked(member.auth.signInWithPassword({ email, password }));
  await checked(member.rpc("create_profile", { profile_name: "Teste Guarda-roupa", chosen_mascot: "cat" }));
  rid = await checked(member.rpc("create_relationship", { relationship_name: "Guarda-roupa Sintético" }));
  await checked(member.from("monthly_plan_items").insert({ relationship_id: rid, owner_id: uid, kind: "expense", label: "Estimativa sintética", amount_cents: 100 }));

  const reviews = await Promise.all(Array.from({ length: 8 }, () => checked(member.rpc("complete_mascot_review"))));
  assert.equal(reviews.filter(Boolean).length, 1, "Concurrent review rewards exactly once");
  const buys = await Promise.all(Array.from({ length: 8 }, () => checked(member.rpc("buy_mascot_item", { target_item: "sweater_sage" }))));
  assert.equal(buys.filter(Boolean).length, 1, "Concurrent retries charge exactly once");
  let wallet = await checked(member.from("mascot_wallets").select("coins,xp").eq("user_id", uid).single());
  assert.deepEqual(wallet, { coins: 0, xp: 20 });
  // Synthetic credit allows two distinct simultaneous purchases competing for 5 coins.
  await checked(admin.from("mascot_wallets").update({ coins: 5 }).eq("user_id", uid));
  const race = await Promise.all(["sweater_rose", "sun_hat"].map(target_item => member.rpc("buy_mascot_item", { target_item })));
  assert.equal(race.filter(result => !result.error).length, 1, "Balance cannot be overspent");
  assert.equal(race.filter(result => result.error?.code === "23514").length, 1);

  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/google-chrome" });
  const page = await browser.newPage({ viewport: { width: 320, height: 740 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:3000/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/conta");
  await page.goto("http://127.0.0.1:3000/mascotes");
  await page.getByRole("heading", { name: "Seu guarda-roupa" }).waitFor();
  console.log("PASS: login and wardrobe page");
  await page.getByRole("button", { name: "Vestir Suéter jardim", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "roupa nova" }).waitFor();
  await page.getByRole("button", { name: "Guardar Suéter jardim", exact: true }).waitFor();
  console.log("PASS: equipment persisted after refresh");
  await page.getByLabel("Seu mascote", { exact: true }).selectOption("dog");
  await page.getByRole("status").filter({ hasText: "Mascote atualizado" }).waitFor();
  await page.reload();
  assert.equal(await page.getByLabel("Seu mascote", { exact: true }).inputValue(), "dog");
  await page.getByRole("button", { name: "Guardar Suéter jardim", exact: true }).waitFor();
  const owned = await checked(member.from("mascot_inventory").select("item_id").eq("user_id", uid));
  const missing = owned.some(row => row.item_id === "sun_hat") ? "Suéter abraço" : "Chapéu de passeio";
  await checked(admin.from("mascot_wallets").update({ coins: 5 }).eq("user_id", uid));
  await page.reload();
  await page.getByRole("button", { name: `Comprar ${missing}`, exact: true }).click();
  await page.getByRole("button", { name: `Confirmar compra ${missing}`, exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Peça comprada" }).waitFor();
  await page.getByRole("button", { name: `Vestir ${missing}`, exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: "/tmp/nosso-futuro-wardrobe-mobile.png", fullPage: true });
  await page.goto("http://127.0.0.1:3000/");
  await page.getByRole("img", { name: "Mascote cachorro de Teste Guarda-roupa", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  wallet = await checked(member.from("mascot_wallets").select("coins,xp").eq("user_id", uid).single());
  assert.deepEqual(wallet, { coins: 0, xp: 20 });
  console.log("PASS: concurrent reviews/purchases, no overspending, confirmed UI purchase, equip, species/reload/dashboard, 320px, no browser errors.");
} finally {
  await browser?.close();
  if (uid) {
    for (const table of ["mascot_inventory", "mascot_reviews", "mascot_wallets"]) await checked(admin.from(table).delete().eq("user_id", uid));
    if (rid) {
      await checked(admin.from("monthly_plan_items").delete().eq("relationship_id", rid));
      await checked(admin.from("relationship_members").delete().eq("relationship_id", rid));
      await checked(admin.from("audit_events").delete().eq("relationship_id", rid));
      await checked(admin.from("relationships").delete().eq("id", rid));
    }
    await checked(admin.from("profiles").delete().eq("id", uid));
    await checked(admin.auth.admin.deleteUser(uid));
  }
}
