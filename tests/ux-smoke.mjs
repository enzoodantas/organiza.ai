// Local synthetic fixtures only. Does not read or change personal accounts.
import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";

loadEnvFile("supabase/.env.local");
const url = process.env.SUPABASE_LOCAL_URL;
const key = process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_LOCAL_SECRET_KEY;
assert(url?.startsWith("http://127.0.0.1:") && key && secret, "Local credentials required");
const admin = createClient(url, secret, { auth: { persistSession: false } });
const member = createClient(url, key, { auth: { persistSession: false } });
const email = `ux-${crypto.randomUUID()}@example.invalid`;
const password = `Local-${crypto.randomUUID()}!`;
let uid, rid, browser;
async function checked(promise) {
  const result = await promise;
  assert(!result.error, result.error?.code ?? "Local request failed");
  return result.data;
}
try {
  uid = (await checked(admin.auth.admin.createUser({ email, password, email_confirm: true }))).user.id;
  await checked(member.auth.signInWithPassword({ email, password }));
  await checked(member.rpc("create_profile", { profile_name: "Pessoa sintética UX", chosen_mascot: "cat" }));
  rid = await checked(member.rpc("create_relationship", { relationship_name: "Espaço sintético UX" }));
  await checked(member.from("monthly_plan_items").insert([
    { relationship_id: rid, owner_id: uid, kind: "expense", label: "Mercado sintético", amount_cents: 1000 },
    { relationship_id: rid, owner_id: uid, kind: "expense", label: "Parcela sintética", amount_cents: 2000, remaining_installments: 3 },
  ]));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/google-chrome" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:3000/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/conta");
  await page.goto("http://127.0.0.1:3000/perfil");
  await expect(page.locator(".demo-pill")).toHaveText(/Conta conectada/);
  await page.getByRole("link", { name: "Registrar movimentação" }).click();
  await expect(page).toHaveURL(/\/financas#novo$/);
  await expect(page.locator("#novo")).toBeInViewport();
  // Tab follows the anchor's focusable target into the actual form.
  await page.locator("#novo").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Tipo", exact: true })).toBeFocused();

  await page.goto("http://127.0.0.1:3000/planejamento");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Retirar Mercado sintético", exact: true }).click();
  await expect(page.getByLabel("Descrição de Mercado sintético", { exact: true })).toBeVisible();
  let items = await checked(member.from("monthly_plan_items").select("id,active").eq("relationship_id", rid));
  assert(items.every(item => item.active), "Cancel leaves estimates active");
  await page.getByLabel("Valor de Mercado sintético em reais", { exact: true }).fill("12,50");
  await page.getByRole("button", { name: "Salvar Mercado sintético", exact: true }).click();
  await expect(page.locator(".plan-item-form").filter({ has: page.getByLabel("Descrição de Mercado sintético", { exact: true }) }).getByRole("status")).toContainText("Mercado sintético");
  await page.reload();
  await expect(page.getByLabel("Valor de Mercado sintético em reais", { exact: true })).toHaveValue("12,50");
  // A transport failure remains next to the affected item; retry stays available.
  const endpoint = "**/rest/v1/monthly_plan_items*";
  await page.route(endpoint, route => route.request().method() === "PATCH" ? route.abort() : route.continue());
  await page.getByRole("button", { name: "Salvar Parcela sintética", exact: true }).click();
  await expect(page.locator(".plan-item-form").filter({ has: page.getByLabel("Descrição de Parcela sintética", { exact: true }) }).getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar Parcela sintética", exact: true })).toBeEnabled();
  await page.unroute(endpoint);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Retirar Mercado sintético", exact: true }).click();
  await expect(page.getByLabel("Descrição de Mercado sintético", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("retirada dos totais");
  await page.reload();
  await expect(page.getByLabel("Descrição de Mercado sintético", { exact: true })).toHaveCount(0);
  items = await checked(member.from("monthly_plan_items").select("active").eq("relationship_id", rid));
  assert.equal(items.filter(item => !item.active).length, 1);

  await page.goto("http://127.0.0.1:3000/desafios");
  await page.getByRole("button", { name: "100 reais: selecionar", exact: true }).click();
  await expect(page.locator(".reservation-form")).toBeFocused();
  await expect(page.locator(".reservation-form")).toBeInViewport();
  await expect(page.getByRole("status")).toContainText("Selecionado:");
  await page.getByRole("button", { name: "Voltar aos números", exact: true }).click();
  await expect(page.getByRole("button", { name: "100 reais: selecionar", exact: true })).toBeFocused();
  await page.getByLabel("Número de 1 a 200", { exact: true }).fill("1.5");
  await expect(page.locator("h1")).toBeVisible();

  for (const width of [320, 360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/financas", "/planejamento", "/desafios", "/mascotes", "/perfil"]) {
      await page.goto(`http://127.0.0.1:3000${route}`);
      await expect(page.locator("h1")).toBeVisible();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow: ${route} at ${width}`);
      const nav = page.locator("nav:visible");
      const financeIcon = await nav.getByRole("link", { name: "Finanças", exact: true }).locator("svg").getAttribute("class");
      const planningIcon = await nav.getByRole("link", { name: "Planejamento", exact: true }).locator("svg").getAttribute("class");
      assert.notEqual(financeIcon, planningIcon, "Distinct finance and planning icons");
      const navBounds = await nav.locator("a").evaluateAll(links => links.map(link => { const r = link.getBoundingClientRect(); return { width: r.width, height: r.height, fits: link.scrollWidth <= link.clientWidth }; }));
      assert(navBounds.every(r => r.width >= 24 && r.height >= 44 && r.fits), "Nav touch areas and labels fit");
    }
  }
  // Reduced layout viewport checks reflow; this is not native browser zoom.
  await page.setViewportSize({ width: 640, height: 450 });
  await page.goto("http://127.0.0.1:3000/planejamento");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Planning reflows at 640px");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/nosso-futuro-ux-planning.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS: profile state, Registrar anchor/keyboard, archive cancel/confirm/persistence, inline save/error, challenge focus/return, distinct icons, six routes at 320/360/390/1280, reflow 640px, no JS errors.");
} finally {
  await browser?.close();
  if (rid) {
    for (const table of ["monthly_plan_items", "relationship_members", "audit_events", "relationships"]) {
      await checked(admin.from(table).delete().eq(table === "relationships" ? "id" : "relationship_id", rid));
    }
  }
  if (uid) {
    await checked(admin.from("profiles").delete().eq("id", uid));
    await checked(admin.auth.admin.deleteUser(uid));
  }
}
