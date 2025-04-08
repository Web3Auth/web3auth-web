import { get, post } from "@toruslabs/http-helpers";
import { LANGUAGE_MAP, LANGUAGE_TYPE, LANGUAGES } from "@web3auth/auth";
import { log } from "@web3auth/no-modal";
import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { browser, mobileOs, platform } from "./interfaces";

const cache = new Map<string, string>();

/** Merge classes with tailwind-merge with clsx full feature and memoization */
export function cn(...inputs: ClassValue[]) {
  // Create a cache key using JSON.stringify
  const cacheKey = JSON.stringify(inputs);

  // Check if the result is already cached
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // If not cached, compute the result
  const result = twMerge(clsx(inputs));

  // Store the result in the cache
  cache.set(cacheKey, result);

  return result;
}

export const getBrowserExtensionUrl = (browserType: browser, walletId: string) => {
  if (walletId?.startsWith("https://")) return walletId;
  switch (browserType) {
    case "chrome":
      return `https://chrome.google.com/webstore/detail/${walletId}`;
    case "firefox":
      return `https://addons.mozilla.org/firefox/addon/${walletId}`;
    case "edge":
      return `https://microsoftedge.microsoft.com/addons/detail/${walletId}`;
    default:
      return null;
  }
};

export const getMobileInstallLink = (os: mobileOs, appId: string) => {
  if (appId?.includes("https://")) {
    return appId;
  }
  switch (os) {
    case "android":
      return `https://play.google.com/store/apps/details?id=${appId}`;
    case "ios":
      return `https://apps.apple.com/app/safepal-wallet/${appId}`;
    default:
      return "";
  }
};

export const getOsName = (os: mobileOs) => {
  switch (os) {
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    default:
      return "";
  }
};

export const getBrowserName = (browserType: browser) => {
  return browserType.charAt(0).toUpperCase() + browserType.slice(1);
};

export const getIcons = (icon: string) => {
  return `https://images.web3auth.io/login-modal/${icon}.svg`;
};

export async function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      resolve(true);
    } else {
      img.addEventListener("load", () => {
        resolve(true);
      });
      img.addEventListener("error", () => {
        reject();
      });
    }
  });
}

export async function getNetworkIconId(ticker: string): Promise<string> {
  const fallbackId = "network-default";
  if (!ticker) return fallbackId;
  try {
    const url = `https://images.web3auth.io/network-${ticker.toLowerCase()}.svg`;
    const isValid = await validateImageUrl(url);
    if (isValid) {
      return `network-${ticker.toLowerCase()}`;
    }
    return fallbackId;
  } catch {
    return fallbackId;
  }
}

export const passwordlessBackendUrl = "https://api-passwordless.web3auth.io";

export const getUserCountry = async (): Promise<{ country: string; dialCode: string } | null> => {
  try {
    const result = await get<{ data: { country: string; dial_code: string } }>(`${passwordlessBackendUrl}/api/v3/user/location`);
    if (result && result.data.country) return { country: result.data.country, dialCode: result.data.dial_code };
    return null;
  } catch (error) {
    log.error("error getting user country", error);
    return null;
  }
};

export const validatePhoneNumber = async (phoneNumber: string): Promise<string | boolean> => {
  try {
    const result = await post<{ success: boolean; parsed_number: string }>(`${passwordlessBackendUrl}/api/v3/phone_number/validate`, {
      phone_number: phoneNumber,
    });
    if (result && result.success) return result.parsed_number;
    return false;
  } catch (error: unknown) {
    log.error("error validating phone number", error);
    if ((error as Response).status === 400) {
      return false;
    }
    // sending true because we don't want the user to be stuck on a flow
    // if there is an error with the api or something went wrong.
    return true;
  }
};

interface NavigatorLanguage {
  userLanguage?: string;
}

export const getUserLanguage = (defaultLanguage: string | undefined): LANGUAGE_TYPE => {
  let userLanguage = defaultLanguage;
  if (!userLanguage) {
    const browserLanguage =
      typeof window !== "undefined" ? (window.navigator as NavigatorLanguage).userLanguage || window.navigator.language || "en-US" : "en-US";
    userLanguage = browserLanguage.split("-")[0];
  }
  return Object.prototype.hasOwnProperty.call(LANGUAGE_MAP, userLanguage) ? (userLanguage as LANGUAGE_TYPE) : LANGUAGES.en;
};

export const getPlatform = (): platform => {
  if (typeof window === "undefined") return "desktop";
  const { userAgent } = window.navigator;
  if (userAgent.includes("Macintosh")) return "desktop";
  if (userAgent.includes("Windows")) return "desktop";
  return "desktop";
};

export function formatIOSMobile(params: { uri: string; link?: string }) {
  const encodedUri: string = encodeURIComponent(params.uri);
  if (params.link.startsWith("http")) return `${params.link}/wc?uri=${encodedUri}`;
  if (params.link) return `${params.link}wc?uri=${encodedUri}`;
  return "";
}

export const getErrorMessages = (errorCode: string): string => {
  if (!errorCode) return "passwordless.something-wrong-error";

  switch (errorCode) {
    case "E001":
      return "passwordless.error-invalid-params";
    case "E002":
      return "passwordless.error-invalid-origin";
    case "E201":
      return "passwordless.error-sending-sms-failed";
    case "E300":
      return "passwordless.error-no-mail-generated";
    case "E301":
      return "passwordless.error-invalid-link";
    case "E302":
      return "passwordless.error-new-link-generated-heading";
    case "E304":
    case "E403":
      return "passwordless.error-max-retry-limit-reached";
    case "E305":
    case "E401":
      return "passwordless.error-invalid-otp";
    case "E306":
      return "passwordless.error-otp-expired";
    case "E400":
      return "passwordless.error-no-sms-generated";
    case "E411":
      return "passwordless.error-plan-limit-reached";
    case "E412":
      return "passwordless.error-recaptcha-verification-failed";
    default:
      return "passwordless.something-wrong-error";
  }
};
