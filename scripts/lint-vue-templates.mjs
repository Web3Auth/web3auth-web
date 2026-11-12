import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vueTemplateRules } from "@toruslabs/oxlint-config-vue";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skippedDirectories = new Set(["node_modules", "dist", "out", "coverage", ".git"]);

function collectVueFiles(directory, files) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (skippedDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectVueFiles(fullPath, files);
      continue;
    }
    if (entry.name.endsWith(".vue")) files.push(fullPath);
  }
}

const vueFiles = [];
collectVueFiles(root, vueFiles);
const templateOnly = vueFiles.filter((file) => !/<script[\s>]/i.test(readFileSync(file, "utf8")));

if (templateOnly.length === 0) process.exit(0);

const configPath = path.join(root, ".vue-templates-oxlintrc.json");
writeFileSync(
  configPath,
  JSON.stringify(
    {
      plugins: ["vue"],
      jsPlugins: ["oxlint-plugin-vize"],
      settings: { vize: { preset: "incremental" } },
      rules: vueTemplateRules,
    },
    null,
    2
  )
);

let status = 1;
try {
  const result = spawnSync(path.join(root, "node_modules", ".bin", "oxlint-vize"), ["-c", configPath, ...templateOnly], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  status = result.status ?? 1;
} finally {
  rmSync(configPath, { force: true });
}

process.exit(status);
