import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { deploymentConfig } from "../scripts/check-deployment.mjs";

const project = "abcdefghijklmnopqrst";
const valid = {
  NEXT_PUBLIC_SUPABASE_URL: `https://${project}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
  APP_URL: "https://nosso-futuro.example.com",
};
const jwt = claims => `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;

test("aceita ambiente hospedado e chave anon do mesmo projeto", () => {
  assert.equal(deploymentConfig(valid).app, valid.APP_URL);
  assert.equal(deploymentConfig({ ...valid,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt({ role: "anon", ref: project }),
  }).backend, valid.NEXT_PUBLIC_SUPABASE_URL);
});

test("recusa localhost, URL privada e configuração ausente", () => {
  for (const backend of ["http://127.0.0.1:54321", "https://localhost", "https://example.com"]) {
    assert.throws(() => deploymentConfig({ ...valid, NEXT_PUBLIC_SUPABASE_URL: backend }));
  }
  for (const app of ["http://example.com", "https://localhost", "https://192.168.1.2", "https://172.16.0.1", "https://example.com/path"]) {
    assert.throws(() => deploymentConfig({ ...valid, APP_URL: app }));
  }
  assert.throws(() => deploymentConfig({}));
});

test("recusa credenciais administrativas e anon de outro projeto", () => {
  for (const key of ["sb_secret_synthetic", jwt({ role: "service_role", ref: project }), jwt({ role: "anon", ref: "other" })]) {
    assert.throws(() => deploymentConfig({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }), /somente a publishable key/);
  }
});

test("pacote inclui assets e exclui arquivos privados; recusa build de outro ambiente", () => {
  const fixture = mkdtempSync(join(tmpdir(), "nosso-futuro-package-"));
  try {
    for (const directory of [".next/standalone", ".next/static", "public"])
      mkdirSync(join(fixture, directory), { recursive: true });
    writeFileSync(join(fixture, ".next/BUILD_ID"), "synthetic-build");
    writeFileSync(join(fixture, ".next/deployment.json"), JSON.stringify({
      buildId: "synthetic-build", backend: valid.NEXT_PUBLIC_SUPABASE_URL, app: valid.APP_URL,
      keyHash: createHash("sha256").update(valid.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).digest("hex"),
    }));
    for (const name of ["server.js", ".env.local", "LOCAL_CONTEXT.md", "AGENTS.md"])
      writeFileSync(join(fixture, ".next/standalone", name), "synthetic");
    writeFileSync(join(fixture, ".next/static/asset.js"), "synthetic");
    writeFileSync(join(fixture, "public/icon.png"), "synthetic");
    const script = fileURLToPath(new URL("../scripts/package-deployment.mjs", import.meta.url));
    const result = spawnSync(process.execPath, [script], { cwd: fixture, env: { ...process.env, ...valid }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const release = readdirSync(join(fixture, ".deploy"))[0];
    const files = readdirSync(join(fixture, ".deploy", release), { recursive: true });
    assert.ok(files.includes("server.js"));
    assert.ok(files.includes("public/icon.png"));
    assert.ok(files.includes(".next/static/asset.js"));
    assert.ok(!files.some(file => /\.env|LOCAL_CONTEXT|AGENTS/.test(file)));
    const wrong = spawnSync(process.execPath, [script], {
      cwd: fixture, env: { ...process.env, ...valid, APP_URL: "https://other.example.com" }, encoding: "utf8",
    });
    assert.notEqual(wrong.status, 0);
    assert.equal(readdirSync(join(fixture, ".deploy")).length, 1);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
