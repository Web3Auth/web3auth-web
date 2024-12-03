// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";

// import { en } from "./i18n";

// const i18nInstance = i18n.createInstance() as typeof i18n;
// i18nInstance.use(initReactI18next).init({
//   resources: {
//     en: { translation: en },
//   },
//   lng: "en",
//   fallbackLng: "en",
//   interpolation: { escapeValue: false },
//   debug: false,
//   react: {
//     useSuspense: true,
//   },
// });

// export default i18nInstance;

import * as i18n from "@solid-primitives/i18n";

import { en } from "./i18n";

export type RawDictionary = typeof en;
export type Dictionary = i18n.Flatten<RawDictionary>;

const localeMap = {
  en: "english",
  fr: "french",
  es: "spanish",
  de: "german",
  ja: "japanese",
  ko: "korean",
  zh: "mandarin",
  pt: "portuguese",
  tr: "turkish",
  nl: "dutch",
};

export type Locale = "en" | "fr" | "es" | "de" | "ja" | "ko" | "zh" | "pt" | "tr" | "nl";

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  const { default: dict } = await import(`./i18n/${localeMap[locale]}.json`);
  return i18n.flatten(dict) as Dictionary; // flatten the dictionary to make all nested keys available top-level
}

export default fetchDictionary;
