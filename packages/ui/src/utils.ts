import { get, post } from "@toruslabs/http-helpers";
import { IAdapter, log, LoginMethodConfig, WALLET_ADAPTERS } from "@web3auth/base";

import { OPENLOGIN_PROVIDERS, OPENLOGIN_PROVIDERS_NAMES, PASSWORDLESS_BACKEND } from "./config";

export const getAdapterSocialLogins = (
  adapterName: string,
  adapter: IAdapter<unknown>,
  loginMethodsConfig: LoginMethodConfig = {}
): LoginMethodConfig => {
  const finalLoginMethodsConfig: LoginMethodConfig = {};
  if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
    OPENLOGIN_PROVIDERS.forEach((loginMethod) => {
      const currentLoginMethodConfig = loginMethodsConfig[loginMethod] || {
        name: OPENLOGIN_PROVIDERS_NAMES[loginMethod],
        showOnMobile: true,
        showOnModal: true,
        showOnDesktop: true,
      };
      finalLoginMethodsConfig[loginMethod] = { ...currentLoginMethodConfig };
    });
    log.debug("OpenLogin login method ui config", finalLoginMethodsConfig);
  } else {
    throw new Error(`${adapterName} is not a valid adapter`);
  }
  return finalLoginMethodsConfig;
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

export const getUserCountry = async (): Promise<string> => {
  try {
    const result = await get<{ data: { country: string } }>(`${PASSWORDLESS_BACKEND}/api/v2/user/location`);
    if (result && result.data.country) return result.data.country;
    return "";
  } catch (error) {
    log.error("error getting user country", error);
    return "";
  }
};

export const validatePhoneNumber = async (phoneNumber: string): Promise<boolean> => {
  try {
    const result = await post<{ success: boolean }>(`${PASSWORDLESS_BACKEND}/api/v2/phone_number/validate`, { phone_number: phoneNumber });
    if (result && result.success) return true;
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

export const languageMap = {
  en: "english",
  de: "german",
  ja: "japanese",
  ko: "korean",
  zh: "mandarin",
  es: "spanish",
  fr: "french",
};
