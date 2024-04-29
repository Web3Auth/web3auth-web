// vite.config.js

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
const path = require("path");
export default defineConfig({
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext',
        },
        define: {
            global: 'globalThis'
          },
        supported: { 
        bigint: true 
        },
    },
  plugins: [vue(), 
    //nodePolyfills({ include: ['crypto', 'stream', 'assert', 'http', 'https', 'os', 'url', 'zlib'] })
],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  target: 'es2020',
})