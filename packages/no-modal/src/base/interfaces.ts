import { type BUTTON_POSITION_TYPE } from "@toruslabs/base-controllers";
import { type SmartAccountType } from "@toruslabs/ethereum-controllers";
import { type AuthConnectionConfig, type WhiteLabelData } from "@web3auth/auth";

import { type ChainNamespaceType, type CustomChainConfig } from "./chain/IChainInterface";

export interface WhitelistResponse {
  urls: string[];
  signed_urls: Record<string, string>;
}

export type ChainsConfig = {
  chainId: string;
  enabled: boolean;
  config: CustomChainConfig;
}[];

export interface ExternalWalletsConfig {
  enabled: boolean;
  config: Record<string, { enabled: boolean }>;
}

export const SMART_ACCOUNT_WALLET_SCOPE = {
  EMBEDDED_ONLY: "embeddedOnly",
  ALL: "all",
} as const;

export type SmartAccountWalletScope = (typeof SMART_ACCOUNT_WALLET_SCOPE)[keyof typeof SMART_ACCOUNT_WALLET_SCOPE];

export interface SmartAccountsConfig {
  enabled: boolean;
  config: {
    smartAccountType: SmartAccountType;
    walletScope: SmartAccountWalletScope;
    chains: {
      chainId: string;
      bundlerConfig: {
        url: string;
      };
      paymasterConfig?: {
        url: string;
      };
    }[];
  };
}

export interface WalletUiConfig {
  portfolioWidgetEnabled: boolean;
  portfolioWidgetPosition: BUTTON_POSITION_TYPE;
  confirmationModalEnabled: boolean;
  walletConnectEnabled: boolean;
  tokenDisplayEnabled: boolean;
  nftDisplayEnabled: boolean;
  defaultPortfolio: "token" | "nft";
  showAllTokensButtonEnabled: boolean;
  buyButtonEnabled: boolean;
  sendButtonEnabled: boolean;
  swapButtonEnabled: boolean;
  receiveButtonEnabled: boolean;
}

// TODO: finalize the project config
export interface ProjectConfig {
  // Legacy
  sms_otp_enabled: boolean;
  /** @deprecated If external_wallets.enabled is true, WC will be enabled automatically */
  wallet_connect_enabled: boolean;
  /** @deprecated always use Web3Auth WalletConnect project ID */
  wallet_connect_project_id?: string;
  /** @deprecated use keyExportEnabled */
  key_export_enabled?: boolean;
  // Project settings
  userDataIncludedInToken?: boolean; // TODO: implement this
  sessionTime?: number;
  keyExportEnabled?: boolean;
  whitelist?: WhitelistResponse; // remain unchanged
  whitelabel?: WhiteLabelData; // remain unchanged
  // Chains
  chains?: ChainsConfig;
  // Login config
  externalWalletLogin?: ExternalWalletsConfig;
  // Smart accounts
  smartAccounts?: SmartAccountsConfig;
  // WS settings
  walletUi?: WalletUiConfig;
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
