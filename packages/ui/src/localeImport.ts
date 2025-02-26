import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./i18n";

const i18nInstance = i18n.createInstance() as typeof i18n;
i18nInstance.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  debug: false,
  react: {
    useSuspense: true,
  },
});

export default i18nInstance;
