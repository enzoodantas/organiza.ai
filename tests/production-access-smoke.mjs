// Runtime config is supplied over stdin, never printed or saved. No emails sent.
// Creates temporary auth sessions for existing accounts; performs only reads in app data.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "@playwright/test";

const config = JSON.parse(readFileSync(0, "utf8"));
assert.equal(config.url, "https://xreqilrvfumwklhouvmr.supabase.co");
const origin = "https://organiza-ai-rust.vercel.app";
const admin = createClient(config.url, config.secret, { auth: { persistSession: false } });
const { data, error } = await admin.auth.admin.listUsers();
assert(!error);
assert.equal(data.users.length, 2);
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
try {
  for (const [index, user] of data.users.entries()) {
    const cookies = new Map();
    const member = createServerClient(config.url, config.key, { cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: entries => entries.forEach(cookie => cookies.set(cookie.name, cookie.value)),
    } });
    let context;
    try {
      const link = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
      assert(!link.error, "Generate non-delivered test token");
      const session = await member.auth.verifyOtp({ type: "magiclink", token_hash: link.data.properties.hashed_token });
      assert(!session.error, "Verify temporary session");
      assert.equal(session.data.user.id, user.id);
      const [plans, profiles, accounts, membership] = await Promise.all([
        member.from("monthly_plan_items").select("id", { count: "exact" }),
        member.from("profiles").select("id"), member.from("accounts").select("id"),
        member.from("relationship_members").select("user_id").is("revoked_at", null),
      ]);
      for (const result of [plans, profiles, accounts, membership]) assert(!result.error);
      assert.equal(plans.count, 18);
      assert.equal(profiles.data.length, 2);
      assert.equal(accounts.data.length, 1);
      assert.equal(membership.data.length, 2);
      context = await browser.newContext({ viewport: { width: 320, height: 740 } });
      await context.addCookies([...cookies].map(([name, value]) => ({ name, value, url: origin, secure: true, sameSite: "Lax" })));
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const path of ["/", "/planejamento", "/financas", "/mascotes", "/perfil", "/conta"]) {
        await page.goto(origin + path);
        assert.equal(new URL(page.url()).pathname, path, "Authenticated route remains accessible");
        await page.locator("h1").waitFor();
        assert.equal(await page.locator("main [role=alert]").count(), 0, "No load error");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "Fits 320px");
      }
      await page.goto(origin + "/mascotes");
      await page.getByRole("heading", { name: "Seu guarda-roupa" }).waitFor();
      assert.deepEqual(errors, []);
      console.log(`PASS: account ${index + 1}, session, 18 planning items, shared access, six routes, wardrobe and 320px.`);
    } finally {
      await context?.close();
      await member.auth.signOut({ scope: "local" });
    }
  }
  const anonymous = await browser.newContext();
  try {
    const page = await anonymous.newPage();
    await page.goto(origin + "/");
    assert.equal(new URL(page.url()).pathname, "/entrar");
    for (const path of ["/.env.local", "/LOCAL_CONTEXT.md", "/AGENTS.md"]) {
      const response = await page.request.get(origin + path);
      assert.equal(response.status(), 404);
    }
    console.log("PASS: anonymous access requires login; private local files return 404.");
  } finally { await anonymous.close(); }
} finally { await browser.close(); }
