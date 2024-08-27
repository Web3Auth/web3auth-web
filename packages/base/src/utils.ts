import { cloneDeep } from "@toruslabs/base-controllers";
import { SIGNER_MAP } from "@toruslabs/constants";
import { get } from "@toruslabs/http-helpers";
import type { WEB3AUTH_NETWORK_TYPE, WhiteLabelData } from "@web3auth/auth";

import { WEB3AUTH_NETWORK } from "./adapter/IAdapter";

export interface WhitelistResponse {
  urls: string[];
  signed_urls: Record<string, string>;
}

export interface PROJECT_CONFIG_RESPONSE {
  whitelabel?: WhiteLabelData;
  sms_otp_enabled: boolean;
  wallet_connect_enabled: boolean;
  wallet_connect_project_id?: string;
  whitelist?: WhitelistResponse;
}

export function storageAvailable(type: "sessionStorage" | "localStorage"): boolean {
  let storageExists = false;
  let storageLength = 0;
  let storage: Storage;
  try {
    storage = window[type];
    storageExists = true;
    storageLength = storage.length;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (error: unknown) {
    const _error = error as DOMException;
    return !!(
      _error &&
      // everything except Firefox
      (_error.code === 22 ||
        // Firefox
        _error.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        _error.name === "QuotaExceededError" ||
        // Firefox
        _error.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storageExists &&
      storageLength !== 0
    );
  }
}

export const isHexStrict = (hex: string): boolean => {
  return (typeof hex === "string" || typeof hex === "number") && /^(-)?0x[0-9a-f]*$/i.test(hex);
};

export const signerHost = (web3AuthNetwork?: WEB3AUTH_NETWORK_TYPE): string => {
  return SIGNER_MAP[web3AuthNetwork ?? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET];
};

export const fetchProjectConfig = async (clientId: string, web3AuthNetwork: WEB3AUTH_NETWORK_TYPE): Promise<PROJECT_CONFIG_RESPONSE> => {
  const url = new URL(`${signerHost(web3AuthNetwork)}/api/configuration`);
  url.searchParams.append("project_id", clientId);
  url.searchParams.append("network", web3AuthNetwork);
  url.searchParams.append("whitelist", "true");
  const res = await get<PROJECT_CONFIG_RESPONSE>(url.href);
  return res;
};

// Normalize wallet name to a standard format, used for external wallets that are auto-detected by MIPD (EIP-6963 and Wallet Standard)
export const normalizeWalletName = (name: string) => {
  let normalizedName = name.toLowerCase();
  // remove decriptive part after | e.g. "Crypto.com | Defi Wallet" => "Crypto.com"
  normalizedName = normalizedName.split("|")[0];

  // replace -  with space e.g. "Trust - Wallet" => "Trust Wallet"
  normalizedName = normalizedName.replace(/-/g, " ");

  // replace multiple spaces with single space
  normalizedName = normalizedName.replace(/\s+/g, " ");

  // remove trailing "wallet" e.g. "Trust Wallet" => "Trust", "GateWallet" => "Gate"
  normalizedName = normalizedName.replace(/wallet$/i, "").trim();

  // replace space with -
  normalizedName = normalizedName.replace(/\s/g, "-");

  return normalizedName;
};

export { cloneDeep };
