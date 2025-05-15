import { VueQueryPlugin } from "@tanstack/vue-query";
import { defineNuxtPlugin } from "nuxt/app";

// TODO: Move to @wagmi/vue/nuxt nitro plugin
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQueryPlugin, {});
});
