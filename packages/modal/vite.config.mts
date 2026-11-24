import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import cascadeLayers from "@csstools/postcss-cascade-layers";
import tailwindcss from "@tailwindcss/postcss";
import { reactLintPreset, tailwindLintPreset } from "@toruslabs/oxlint-config-react";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { libraryPreset } from "@toruslabs/torus-scripts/library";
import prefixSelector from "postcss-prefix-selector";
import { defineConfig } from "vite-plus";

const parentPrefix = ".w3a-parent-container";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };
const preset = libraryPreset({
  entry: "src/index.ts",
  format: ["esm", "cjs"],
});
const react = reactLintPreset();
const tailwind = tailwindLintPreset({
  entryPoint: "src/ui/css/index.css",
});

export default defineConfig({
  fmt: formatPreset(),
  lint: {
    ...react,
    jsPlugins: [...(react.jsPlugins ?? []), ...(tailwind.jsPlugins ?? [])],
    rules: { ...react.rules, ...tailwind.rules },
    settings: { ...react.settings, ...tailwind.settings },
  },
  pack: {
    ...preset.pack,
    entry: {
      index: "src/index.ts",
      "account-linking/index": "src/account-linking/index.ts",
      "account-linking/react": "src/account-linking/react.ts",
      "account-linking/vue": "src/account-linking/vue.ts",
      "x402/index": "src/x402/index.ts",
      "x402/react": "src/x402/react.ts",
      "x402/vue": "src/x402/vue.ts",
      "react/index": "src/react/index.ts",
      "react/wagmi/index": "src/react/wagmi/index.ts",
      "react/solana/index": "src/react/solana/index.ts",
      "vue/index": "src/vue/index.ts",
      "vue/solana/index": "src/vue/solana/index.ts",
      "vue/wagmi/index": "src/vue/wagmi/index.ts",
      "connectors/index": "src/connectors/index.ts",
      "connectors/base-account-connector/index": "src/connectors/base-account-connector/index.ts",
      "connectors/coinbase-connector/index": "src/connectors/coinbase-connector/index.ts",
      "providers/xrpl-provider/index": "src/providers/xrpl-provider/index.ts",
    },
    define: {
      "process.env.WEB3AUTH_VERSION": JSON.stringify(pkg.version),
    },
    deps: {
      neverBundle: true,
    },
    css: {
      transformer: "postcss",
      minify: true,
      postcss: {
        plugins: [
          tailwindcss(),
          cascadeLayers(),
          prefixSelector({
            prefix: parentPrefix,
            transform(_prefix, selector, prefixedSelector) {
              if (selector.startsWith(parentPrefix)) return selector;
              if (selector.includes(":root") || selector.includes(":host")) {
                return selector.replaceAll(":root", parentPrefix).replaceAll(":host", parentPrefix);
              }
              return prefixedSelector;
            },
          }),
        ],
      },
    },
    plugins: [
      {
        name: "inject-modal-css",
        async writeBundle(outputOptions, bundle) {
          if (!outputOptions.dir) return;
          const cssAsset = bundle["style.css"];
          const manager = Object.values(bundle).find((item) => item.type === "chunk" && item.fileName.endsWith("modalManager.js"));
          if (cssAsset?.type === "asset" && manager?.type === "chunk") {
            const css = typeof cssAsset.source === "string" ? cssAsset.source : new TextDecoder().decode(cssAsset.source);
            const file = path.join(outputOptions.dir, manager.fileName);
            const source = await readFile(file, "utf8");
            if (!source.includes('createElement("style")')) {
              const body = source.replace(/^"use client";\n?/, "");
              const injector = `"use client";\nif (typeof document !== "undefined") { const style = document.createElement("style"); style.textContent = ${JSON.stringify(css)}; document.head.appendChild(style); }\n`;
              await writeFile(file, `${injector}${body}`);
            }
          }
          const entry = bundle["index.js"];
          if (entry?.type === "chunk") {
            const file = path.join(outputOptions.dir, entry.fileName);
            const source = await readFile(file, "utf8");
            if (!source.startsWith('"use client"')) await writeFile(file, `"use client";\n${source}`);
          }
        },
      },
    ],
    dts: true,
    format: {
      esm: { outDir: "dist/lib.esm" },
      cjs: { outDir: "dist/lib.cjs" },
    },
    hash: false,
    exports: false,
    outputOptions: {
      chunkFileNames(chunk: { name: string }) {
        const extension = chunk.name.endsWith(".d") ? ".d.ts" : ".js";
        return `chunks/${chunk.name}${extension}`;
      },
    },
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    sourcemap: true,
  },
});
