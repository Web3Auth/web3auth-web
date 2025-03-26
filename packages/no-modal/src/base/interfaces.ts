import { type BUTTON_POSITION_TYPE } from "@toruslabs/base-controllers";
import { type SmartAccountType } from "@toruslabs/ethereum-controllers";
import { type AuthConnectionConfig, type WhiteLabelData } from "@web3auth/auth";

import { type ChainNamespaceType, type CustomChainConfig } from "./chain/IChainInterface";
import { SMART_ACCOUNT_WALLET_SCOPE } from "./connector";

export interface WhitelistResponse {
  urls: string[];
  signed_urls: Record<string, string>;
}

export type ChainsConfig = CustomChainConfig[];

export interface ExternalWalletsConfig {
  disableAllRecommendedWallets?: boolean;
  disableAllOtherWallets?: boolean;
  disabledWallets?: string[];
}

export type SmartAccountWalletScope = (typeof SMART_ACCOUNT_WALLET_SCOPE)[keyof typeof SMART_ACCOUNT_WALLET_SCOPE];

export interface SmartAccountsConfig {
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
}

export interface WalletUiConfig {
  enablePortfolioWidget?: boolean;
  enableConfirmationModal?: boolean;
  enableWalletConnect?: boolean;
  enableTokenDisplay?: boolean;
  enableNftDisplay?: boolean;
  enableShowAllTokensButton?: boolean;
  enableBuyButton?: boolean;
  enableSendButton?: boolean;
  enableSwapButton?: boolean;
  enableReceiveButton?: boolean;
  portfolioWidgetPosition?: BUTTON_POSITION_TYPE;
  defaultPortfolio?: "token" | "nft";
}

// TODO: finalize the project config
export interface ProjectConfig {
  // Legacy
  sms_otp_enabled: boolean;
  // Project settings
  userDataIncludedInToken?: boolean; // TODO: implement this
  sessionTime?: number;
  enableKeyExport?: boolean;
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
