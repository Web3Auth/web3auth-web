import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// import { de, en, es, fr, ja, ko, zh } from "./i18n";
import { en } from "./i18n";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    // de: { translation: de },
    // es: { translation: es },
    // fr: { translation: fr },
    // ja: { translation: ja },
    // ko: { translation: ko },
    // zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  debug: true,
  react: {
    useSuspense: true,
  },
});

export default i18n;
