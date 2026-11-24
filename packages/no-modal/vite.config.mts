import { readFileSync } from "node:fs";

import { typescriptLintPreset } from "@toruslabs/oxlint-config-typescript";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { libraryPreset } from "@toruslabs/torus-scripts/library";
import { defineConfig } from "vite-plus";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };
const preset = libraryPreset({
  entry: "src/index.ts",
  format: ["esm", "cjs"],
});

export default defineConfig({
  fmt: formatPreset(),
  lint: typescriptLintPreset(),
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
