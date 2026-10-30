// Synthetic local accounts only; never uploads real personal photographs.
import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

loadEnvFile("supabase/.env.local");
const url = process.env.SUPABASE_LOCAL_URL, key = process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY;
assert(url?.startsWith("http://127.0.0.1:") && key && process.env.SUPABASE_LOCAL_SECRET_KEY);
const admin = createClient(url, process.env.SUPABASE_LOCAL_SECRET_KEY, { auth: { persistSession: false } });
const users = [];
let rid, browser;
async function checked(request) {
  const result = await request;
  assert(!result.error, result.error?.code ?? "Request failed");
  return result.data;
}
try {
  for (let i = 0; i < 2; i++) {
    const email = `photo-${crypto.randomUUID()}@example.invalid`, password = `Local-${crypto.randomUUID()}!`;
    const { user } = await checked(admin.auth.admin.createUser({ email, password, email_confirm: true }));
    const client = createClient(url, key, { auth: { persistSession: false } });
    users.push({ id: user.id, client, email, password });
    await checked(client.auth.signInWithPassword({ email, password }));
    await checked(client.rpc("create_profile", { profile_name: `Foto Teste ${i + 1}`, chosen_mascot: "cat" }));
  }
  const [owner, peer] = users;
  rid = await checked(owner.client.rpc("create_relationship", { relationship_name: "Photo synthetic" }));
  await checked(admin.from("relationship_members").insert({ relationship_id: rid, user_id: peer.id }));
  browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 740 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:3000/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(owner.email);
  await page.getByLabel("Senha", { exact: true }).fill(owner.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/conta");
  await page.goto("http://127.0.0.1:3000/perfil");
  await page.getByLabel("Escolher foto", { exact: true }).setInputFiles({ name: "invalid.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
  await page.getByRole("alert").filter({ hasText: "JPG, PNG ou WebP" }).waitFor();
  await page.getByLabel("Escolher foto", { exact: true }).setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(8 * 1024 * 1024 + 1) });
  await page.getByRole("alert").filter({ hasText: "até 8 MB" }).waitFor();

  async function choose(color) {
    const data = await page.evaluate(color => {
      const c = document.createElement("canvas"); c.width = 800; c.height = 600;
      const ctx = c.getContext("2d"); ctx.fillStyle = color; ctx.fillRect(0,0,800,600);
      ctx.fillStyle = "#fff"; ctx.font = "120px sans-serif"; ctx.fillText("NF",300,350);
      return c.toDataURL("image/png").split(",")[1];
    }, color);
    await page.locator('input[type="file"]').setInputFiles({ name: "fixture.png", mimeType: "image/png", buffer: Buffer.from(data, "base64") });
    await page.getByRole("button", { name: "Salvar foto", exact: true }).waitFor();
  }
  await choose("#47745c");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  assert.equal((await checked(owner.client.from("profile_photos").select("user_id"))).length, 0, "Cancel does not write");
  await choose("#47745c");
  await page.getByRole("button", { name: "Salvar foto", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Foto de perfil salva" }).waitFor();
  await page.getByRole("button", { name: "Remover foto", exact: true }).waitFor();
  await page.locator(".topbar-profile img").waitFor();
  const first = await checked(owner.client.from("profile_photos").select("image_data").single());
  assert(first.image_data.startsWith("data:image/jpeg;base64,"));
  assert(Buffer.from(first.image_data.split(",")[1], "base64").length <= 32768);
  await page.reload();
  await page.locator(".topbar-profile img").waitFor();
  assert.equal(await page.locator(".topbar-profile img").evaluate(img => img.naturalWidth), 192);
  assert.equal((await checked(peer.client.from("profile_photos").select("image_data").single())).image_data, first.image_data);
  await checked(peer.client.rpc("set_profile_photo", { photo_data: null }));
  assert.equal((await checked(owner.client.from("profile_photos").select("user_id"))).length, 1);

  await choose("#b77f73");
  await page.getByRole("button", { name: "Salvar foto", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Foto de perfil salva" }).waitFor();
  await page.getByRole("button", { name: "Remover foto", exact: true }).waitFor();
  const replaced = await checked(owner.client.from("profile_photos").select("image_data"));
  assert.equal(replaced.length, 1);
  assert.notEqual(replaced[0].image_data, first.image_data);
  await page.goto("http://127.0.0.1:3000/conta");
  await page.locator(".profile-member img").waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: "/tmp/nosso-futuro-profile-photo-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Remover foto", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Foto de perfil removida" }).waitFor();
  await page.reload();
  assert.equal(await page.locator(".topbar-profile img").count(), 0);
  assert.equal((await checked(owner.client.from("profile_photos").select("user_id"))).length, 0);
  assert.deepEqual(errors, []);
  console.log("PASS: upload, invalid files, cancel, JPEG 192px/32KB, header/reload, replace without accumulation, peer access, removal and 320px.");
} finally {
  await browser?.close();
  if (rid) {
    await checked(admin.from("relationship_members").delete().eq("relationship_id", rid));
    await checked(admin.from("relationships").delete().eq("id", rid));
  }
  for (const user of users) {
    await checked(admin.from("profiles").delete().eq("id", user.id));
    await checked(admin.auth.admin.deleteUser(user.id));
  }
}
