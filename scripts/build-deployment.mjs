import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { deploymentConfig } from "./check-deployment.mjs";

const config = deploymentConfig();
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"], {
  stdio: "inherit", env: { ...process.env, APP_STANDALONE: "true" },
});
if (result.status !== 0) process.exit(result.status ?? 1);
writeFileSync(".next/deployment.json", JSON.stringify({
  buildId: readFileSync(".next/BUILD_ID", "utf8").trim(),
  backend: config.backend,
  app: config.app,
  keyHash: createHash("sha256").update(config.key).digest("hex"),
}));
