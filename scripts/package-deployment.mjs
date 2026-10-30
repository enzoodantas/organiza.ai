import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { deploymentConfig } from "./check-deployment.mjs";

const config = deploymentConfig();
const build = JSON.parse(await readFile(".next/deployment.json", "utf8"));
if (build.buildId !== (await readFile(".next/BUILD_ID", "utf8")).trim() ||
    build.backend !== config.backend || build.app !== config.app ||
    build.keyHash !== createHash("sha256").update(config.key).digest("hex"))
  throw new Error("O build foi feito para outro ambiente. Execute npm run build:deploy com as variáveis do destino.");

const target = join(".deploy", `release-${Date.now()}`);
await mkdir(target, { recursive: true });
const blocked = name => name.startsWith(".env") || ["AGENTS.md", "LOCAL_CONTEXT.md", ".git"].includes(name);
await cp(".next/standalone", target, { recursive: true, filter: path => !blocked(basename(path)) });
await cp(".next/static", join(target, ".next/static"), { recursive: true });
await cp("public", join(target, "public"), { recursive: true });
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (blocked(entry.name)) throw new Error("Arquivo privado encontrado no pacote. Publicação recusada.");
    if (entry.isDirectory()) await inspect(join(directory, entry.name));
  }
}
await inspect(target);
console.log(`Pacote Node standalone preparado em ${target}. Inicie com HOSTNAME=0.0.0.0 PORT=8080 node server.js.`);
