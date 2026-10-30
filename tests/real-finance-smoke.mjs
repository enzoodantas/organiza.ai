// Local only: creates a synthetic account, exercises the real UI, then removes its data.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

const url = process.env.SUPABASE_LOCAL_URL;
const publishable = process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_LOCAL_SECRET_KEY;
if (!url?.startsWith("http://127.0.0.1:") || !publishable || !secret)
  throw new Error("Este smoke test só pode usar o Supabase local com suas três variáveis locais.");

const admin = createClient(url, secret, { auth: { persistSession: false } });
const email = `finance-smoke-${crypto.randomUUID()}@example.invalid`;
const password = `LocalOnly-${crypto.randomUUID()}!`;
let userId;
let relationshipId;
let browser;

async function remove(table, column, value) {
  const { error } = await admin.from(table).delete().eq(column, value);
  if (error) throw new Error(`Falha ao limpar ${table}: ${error.code ?? error.message}`);
}

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) throw new Error(`Falha na conta sintética: ${createError?.code}`);
  userId = created.user.id;
  const member = createClient(url, publishable, { auth: { persistSession: false } });
  const { error: loginError } = await member.auth.signInWithPassword({ email, password });
  if (loginError) throw new Error(`Falha no login sintético: ${loginError.code}`);
  const { error: profileError } = await member.rpc("create_profile", { profile_name: "Teste Financeiro", chosen_mascot: "cat" });
  if (profileError) throw new Error(`Falha no perfil sintético: ${profileError.code}`);
  const { data: relationship, error: relationshipError } = await member.rpc("create_relationship", { relationship_name: "Espaço Sintético" });
  if (relationshipError || !relationship) throw new Error(`Falha no vínculo sintético: ${relationshipError?.code}`);
  relationshipId = String(relationship);

  browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/google-chrome" });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("http://127.0.0.1:3000/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/conta");
  await page.goto("http://127.0.0.1:3000/financas");
  await page.getByRole("heading", { name: "Finanças reais, com clareza." }).waitFor();
  await page.getByLabel("Nome", { exact: true }).fill("Conta sintética");
  await page.getByLabel("Saldo inicial (R$)").fill("100,00");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByText("Conta criada com saldo inicial", { exact: false }).waitFor();
  await page.getByLabel("Tipo").selectOption("income");
  await page.getByLabel("Descrição", { exact: true }).fill("Entrada sintética");
  await page.getByLabel("Valor (R$)").fill("20,00");
  await page.getByLabel("Conta de destino").selectOption({ label: "Conta sintética" });
  await page.getByRole("button", { name: "Salvar movimentação" }).click();
  await page.getByText("Movimentação salva no banco", { exact: false }).waitFor();
  await page.goto("http://127.0.0.1:3000/desafios");
  await page.getByLabel("Número de 1 a 200").fill("10");
  const accountOption = await page.getByLabel("Conta que guarda o dinheiro").locator("option").nth(1).getAttribute("value");
  assert.ok(accountOption);
  await page.getByLabel("Conta que guarda o dinheiro").selectOption(accountOption);
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await page.getByText("Número 10 reservado", { exact: false }).waitFor();
  await page.reload();
  await page.getByText("1/200 números").waitFor();

  const { data: positions, error: positionsError } = await member.rpc("list_account_positions", { target_relationship: relationshipId });
  if (positionsError) throw new Error(`Falha no saldo sintético: ${positionsError.code}`);
  assert.equal(positions?.length, 1);
  assert.equal(positions[0].balance_cents, "12000");
  assert.equal(positions[0].reserved_cents, "1000");
  assert.equal(positions[0].available_cents, "11000");
  await page.goto("http://127.0.0.1:3000/");
  await page.getByText("Registros salvos").waitFor();
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of ["/", "/financas", "/desafios"]) {
    await page.goto(`http://127.0.0.1:3000${route}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true,
      `Rolagem horizontal em ${route}`);
  }
  page.on("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reverter" }).click();
  await page.getByText("Reserva revertida", { exact: false }).waitFor();
  await page.goto("http://127.0.0.1:3000/financas");
  await page.getByRole("button", { name: "Reverter" }).click();
  await page.getByText("Movimentação revertida", { exact: false }).waitFor();
  const { data: finalPositions, error: finalError } = await member.rpc("list_account_positions", { target_relationship: relationshipId });
  if (finalError) throw new Error(`Falha no saldo final sintético: ${finalError.code}`);
  assert.equal(finalPositions?.[0]?.balance_cents, "10000");
  assert.equal(finalPositions?.[0]?.reserved_cents, "0");
  assert.equal(finalPositions?.[0]?.available_cents, "10000");
  const today = new Date().toISOString().slice(0, 10);
  const { data: raceAccount, error: accountError } = await member.rpc("create_financial_account", {
    target_relationship: relationshipId, account_name: "Conta de concorrência",
    account_scope: "individual", opening_cents: 10000, opening_on: today,
    request_key: crypto.randomUUID(),
  });
  if (accountError || !raceAccount) throw new Error(`Falha na conta de concorrência: ${accountError?.code}`);
  const secondMember = createClient(url, publishable, { auth: { persistSession: false } });
  const { error: secondLoginError } = await secondMember.auth.signInWithPassword({ email, password });
  if (secondLoginError) throw new Error(`Falha na segunda sessão sintética: ${secondLoginError.code}`);
  const expense = (client, key) => client.rpc("record_financial_entry", {
    target_relationship: relationshipId, entry_kind: "expense", amount_cents: 8000,
    source_id: raceAccount, destination_id: null, entry_description: "Despesa concorrente",
    entry_on: today, request_key: key,
  });
  const race = await Promise.all([expense(member, crypto.randomUUID()), expense(secondMember, crypto.randomUUID())]);
  assert.equal(race.filter(result => !result.error).length, 1);
  assert.equal(race.filter(result => result.error?.code === "22003").length, 1);
  const { data: racePositions, error: racePositionsError } = await member.rpc("list_account_positions", { target_relationship: relationshipId });
  if (racePositionsError) throw new Error(`Falha no saldo concorrente: ${racePositionsError.code}`);
  assert.equal(racePositions.find(item => item.account_id === raceAccount)?.available_cents, "2000");
  assert.deepEqual(pageErrors, []);
  console.log("Fluxo financeiro real sintético passou: login, conta, receita, reserva, reload, mobile, reversões e concorrência.");
} finally {
  if (browser) await browser.close();
  if (relationshipId) {
    await remove("contributions", "relationship_id", relationshipId);
    await remove("financial_entries", "relationship_id", relationshipId);
    await remove("reward_events", "relationship_id", relationshipId);
    await remove("monthly_plan_items", "relationship_id", relationshipId);
    await remove("campaigns", "relationship_id", relationshipId);
    await remove("account_opening_balances", "relationship_id", relationshipId);
    await remove("accounts", "relationship_id", relationshipId);
    await remove("relationship_invitations", "relationship_id", relationshipId);
    await remove("relationship_members", "relationship_id", relationshipId);
    await remove("audit_events", "relationship_id", relationshipId);
    await remove("relationships", "id", relationshipId);
  }
  if (userId) {
    await remove("profiles", "id", userId);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error(`Falha ao remover conta sintética: ${error.code}`);
  }
}
