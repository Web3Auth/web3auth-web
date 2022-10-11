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
};

export const getUserLanguage = () => {
  let userLanguage = (window.navigator as NavigatorLanguage).userLanguage || window.navigator.language || "en-US";
  const userLanguageArr = userLanguage.split("-");
  userLanguage = Object.prototype.hasOwnProperty.call(languageMap, userLanguageArr[0]) ? userLanguageArr[0] : "en";
  return userLanguage;
};
