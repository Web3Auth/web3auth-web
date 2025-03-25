import { AuthConnectionConfig, WhiteLabelData } from "@web3auth/auth";

import { ChainNamespaceType } from "./chain/IChainInterface";

export interface WhitelistResponse {
  urls: string[];
  signed_urls: Record<string, string>;
}

// TODO: add more data from dashboard including chains
export interface PROJECT_CONFIG_RESPONSE {
  whitelabel?: WhiteLabelData;
  sms_otp_enabled: boolean;
  wallet_connect_enabled: boolean;
  wallet_connect_project_id?: string;
  whitelist?: WhitelistResponse;
  key_export_enabled?: boolean;
  auth_connection_config?: AuthConnectionConfig;
}

export interface WalletRegistryItem {
  name: string;
  chains: string[];
  walletConnect?: {
    sdks: string[];
  };
  app?: {
    browser?: string;
    android?: string;
    ios?: string;
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mobile?: {
    native?: string;
    universal?: string;
    inAppBrowser?: string;
  };
  primaryColor?: string;
  injected?: {
    namespace: ChainNamespaceType;
    injected_id: string;
  }[];
  imgExtension?: string;
}

export type WalletRegistry = { others: Record<string, WalletRegistryItem>; default: Record<string, WalletRegistryItem> };
