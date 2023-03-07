import { get, post } from "@toruslabs/http-helpers";
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
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

export const getPasswordlessBackendUrl = (web3AuthNetwork: OPENLOGIN_NETWORK_TYPE) => {
  return PASSWORDLESS_BACKEND[web3AuthNetwork] ?? PASSWORDLESS_BACKEND.mainnet;
};

export const getUserCountry = async (web3AuthNetwork: OPENLOGIN_NETWORK_TYPE): Promise<{ country: string; dialCode: string } | null> => {
  try {
    const result = await get<{ data: { country: string; dial_code: string } }>(`${getPasswordlessBackendUrl(web3AuthNetwork)}/api/v2/user/location`);
    if (result && result.data.country) return { country: result.data.country, dialCode: result.data.dial_code };
    return null;
  } catch (error) {
    log.error("error getting user country", error);
    return null;
  }
};

export const validatePhoneNumber = async (phoneNumber: string, web3AuthNetwork: OPENLOGIN_NETWORK_TYPE): Promise<string | boolean> => {
  try {
    const result = await post<{ success: boolean; parsed_number: string }>(
      `${getPasswordlessBackendUrl(web3AuthNetwork)}/api/v2/phone_number/validate`,
      {
        phone_number: phoneNumber,
      }
    );
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

export const languageMap = {
  en: "english",
  de: "german",
  ja: "japanese",
  ko: "korean",
  zh: "mandarin",
  es: "spanish",
  fr: "french",
};
