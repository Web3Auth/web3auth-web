import "./global";
import "./style.css";

import { VueQueryPlugin } from "@tanstack/vue-query";
import { createI18n, PathValue } from "petite-vue-i18n";
import { createApp } from "vue";

import App from "./App.vue";
import createIcons from "./plugins/iconPlugin";
import en from "./translations/en.json";
import vi from "./translations/vi.json";

const i18n = createI18n({
  locale: "en", // set locale
  fallbackLocale: "en",
  messages: { vi, en },
  legacy: false,
  messageResolver: (obj: unknown, path: string): PathValue | null => {
    const keys = path.split(".");
    const value = keys.reduce((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return null;
    }, obj);
    return value as PathValue;
  },
  fallbacker: (_: string, fallbackLocale: string): string => {
    return fallbackLocale;
  },
});

const app = createApp(App);

app.use(createIcons);
app.use(i18n);
app.use(VueQueryPlugin);
app.mount("#app");
