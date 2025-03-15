import { WhiteLabelData } from "@web3auth/auth";

import { ChainNamespaceType, CustomChainConfig } from "./chain/IChainInterface";

export interface WhitelistResponse {
  urls: string[];
  signed_urls: Record<string, string>;
}

export interface ExternalWalletsConfig {
  enabled: boolean;
  wallets: Record<string, { enabled: boolean }>;
}

// TODO: finalize the project config
export interface ProjectConfig {
  // Legacy
  whitelabel?: WhiteLabelData;
  sms_otp_enabled: boolean;
  /** @deprecated If external_wallets.enabled is true, WC will be enabled automatically */
  wallet_connect_enabled: boolean;
  /** @deprecated always use Web3Auth WalletConnect project ID */
  wallet_connect_project_id?: string;
  whitelist?: WhitelistResponse;
  key_export_enabled?: boolean;
  // Chains
  chains?: CustomChainConfig[];
  // External wallets
  external_wallets?: ExternalWalletsConfig;
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
