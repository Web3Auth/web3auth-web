interface NavigatorLanguage {
  userLanguage?: string;
}

export const languageMap = {
  en: "english",
  de: "german",
  ja: "japanese",
  ko: "korean",
  zh: "mandarin",
  es: "spanish",
  fr: "french",
  pt: "portuguese",
};

export const getUserLanguage = (defaultLanguage: string | undefined) => {
  let userLanguage = defaultLanguage;
  if (!userLanguage) {
    const browserLanguage =
      typeof window !== "undefined" ? (window.navigator as NavigatorLanguage).userLanguage || window.navigator.language || "en-US" : "en-US";
    userLanguage = browserLanguage.split("-")[0];
  }
  return Object.prototype.hasOwnProperty.call(languageMap, userLanguage) ? userLanguage : "en";
};
