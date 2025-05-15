export default defineNuxtConfig({
  ssr: true,
  build: {
    transpile: ["@web3auth/modal", "@wagmi/vue", "viem", "color"],
  },
  vite: {
    resolve: {
      alias: {
        color: "color/index.js",
      },
    },
    optimizeDeps: {
      include: ["color"],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
      },
    },
  },
  alias: {
    color: require.resolve("color"),
  },
});
