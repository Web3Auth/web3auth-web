import { createApp } from "vue";
import { createI18n } from "vue-i18n";

import vi from "./translations/vi.json";
import en from "./translations/en.json";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  fallbackLocale: "en",
  messages: { vi, en },
});

import "./style.css";

import App from "./App.vue";
import createIcons from "./plugins/iconPlugin";

const app = createApp(App);

app.use(createIcons);
app.use(i18n);
app.mount("#app");
