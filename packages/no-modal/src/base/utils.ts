import { CHAIN_NAMESPACES, cloneDeep } from "@toruslabs/base-controllers";
import { SIGNER_MAP } from "@toruslabs/constants";
import { type AccountAbstractionMultiChainConfig } from "@toruslabs/ethereum-controllers";
import { get } from "@toruslabs/http-helpers";
import { BUILD_ENV, type BUILD_ENV_TYPE } from "@web3auth/auth";
import { type Chain } from "viem";

import { type CustomChainConfig } from "./chain/IChainInterface";
import { WEB3AUTH_NETWORK, type WEB3AUTH_NETWORK_TYPE } from "./connector";
import { type UIConfig, type WalletServicesConfig } from "./core/IWeb3Auth";
import type { ProjectConfig, WalletRegistry } from "./interfaces";

export const isHexStrict = (hex: string): boolean => {
  return (typeof hex === "string" || typeof hex === "number") && /^(-)?0x[0-9a-f]*$/i.test(hex);
};

export const signerHost = (
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE = WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  authBuildEnv: BUILD_ENV_TYPE = BUILD_ENV.PRODUCTION
): string => {
  if (authBuildEnv === BUILD_ENV.TESTING || authBuildEnv === BUILD_ENV.DEVELOPMENT) {
    return "https://test-signer.web3auth.io";
  }
  return SIGNER_MAP[web3AuthNetwork];
};

export const fetchProjectConfig = async ({
  clientId,
  web3AuthNetwork,
  aaProvider,
  authBuildEnv,
}: {
  clientId: string;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  aaProvider?: string;
  authBuildEnv?: BUILD_ENV_TYPE;
}): Promise<ProjectConfig> => {
  const url = new URL(`${signerHost(web3AuthNetwork, authBuildEnv)}/api/v2/configuration`);
  url.searchParams.append("project_id", clientId);
  url.searchParams.append("network", web3AuthNetwork);
  if (authBuildEnv) url.searchParams.append("build_env", authBuildEnv);
  if (aaProvider) url.searchParams.append("aa_provider", aaProvider);
  const res = await get<ProjectConfig>(url.href);
  return res;
};

export const fetchWalletRegistry = async (url?: string): Promise<WalletRegistry> => {
  const res = await get<WalletRegistry>(url || "https://assets.web3auth.io/v1/wallet-registry.json");
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

export const fromWagmiChain = (chain: Chain): CustomChainConfig => {
  return {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: `0x${chain.id.toString(16)}`,
    rpcTarget: chain.rpcUrls.default.http[0],
    displayName: chain.name,
    blockExplorerUrl: chain.blockExplorers?.default.url || "",
    ticker: chain.nativeCurrency.symbol,
    tickerName: chain.nativeCurrency.name,
    logo: "",
    decimals: chain.nativeCurrency.decimals,
    isTestnet: chain.testnet,
    wsTarget: chain.rpcUrls.default.webSocket?.[0],
  };
};

export function withAbort<T>(fn: () => Promise<T>, signal?: AbortSignal, onAbort?: () => void): Promise<T> {
  if (!signal) return fn();

  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));

  return new Promise((resolve, reject) => {
    const abort = () => {
      onAbort?.();
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal.addEventListener("abort", abort);

    return Promise.resolve()
      .then(() => fn())
      .then(resolve, reject)
      .finally(() => {
        signal.removeEventListener("abort", abort);
      });
  });
}

export const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

export const fromViemChain = fromWagmiChain;

export { cloneDeep };

export const getWhitelabelAnalyticsProperties = (uiConfig?: UIConfig) => {
  return {
    whitelabel_app_name: uiConfig?.appName,
    whitelabel_app_url: uiConfig?.appUrl,
    whitelabel_logo_light_enabled: Boolean(uiConfig?.logoLight),
    whitelabel_logo_dark_enabled: Boolean(uiConfig?.logoDark),
    whitelabel_default_language: uiConfig?.defaultLanguage,
    whitelabel_theme_mode: uiConfig?.mode,
    whitelabel_use_logo_loader: uiConfig?.useLogoLoader,
    whitelabel_theme_primary: uiConfig?.theme?.primary,
    whitelabel_theme_on_primary: uiConfig?.theme?.onPrimary,
    whitelabel_tnc_link_enabled: Boolean(uiConfig?.tncLink),
    whitelabel_privacy_policy_enabled: Boolean(uiConfig?.privacyPolicy),
  };
};

export const getAaAnalyticsProperties = (accountAbstractionConfig?: AccountAbstractionMultiChainConfig) => {
  return {
    aa_smart_account_type: accountAbstractionConfig?.smartAccountType,
    aa_chain_ids: accountAbstractionConfig?.chains?.map((chain) => chain.chainId),
    aa_paymaster_enabled: accountAbstractionConfig?.chains?.some((chain) => chain.paymasterConfig),
    aa_paymaster_context_enabled: accountAbstractionConfig?.chains?.some((chain) => chain.bundlerConfig?.paymasterContext),
    aa_erc20_paymaster_enabled: accountAbstractionConfig?.chains?.some(
      (chain) => (chain.bundlerConfig?.paymasterContext as { token: string })?.token
    ),
  };
};

export const getWalletServicesAnalyticsProperties = (walletServicesConfig?: WalletServicesConfig) => {
  return {
    ws_confirmation_strategy: walletServicesConfig?.confirmationStrategy,
    ws_enable_key_export: walletServicesConfig?.enableKeyExport,
    ws_show_widget_button: walletServicesConfig?.whiteLabel?.showWidgetButton,
    ws_button_position: walletServicesConfig?.whiteLabel?.buttonPosition,
    ws_hide_nft_display: walletServicesConfig?.whiteLabel?.hideNftDisplay,
    ws_hide_token_display: walletServicesConfig?.whiteLabel?.hideTokenDisplay,
    ws_hide_transfers: walletServicesConfig?.whiteLabel?.hideTransfers,
    ws_hide_topup: walletServicesConfig?.whiteLabel?.hideTopup,
    ws_hide_receive: walletServicesConfig?.whiteLabel?.hideReceive,
    ws_hide_swap: walletServicesConfig?.whiteLabel?.hideSwap,
    ws_hide_show_all_tokens: walletServicesConfig?.whiteLabel?.hideShowAllTokens,
    ws_hide_wallet_connect: walletServicesConfig?.whiteLabel?.hideWalletConnect,
    ws_default_portfolio: walletServicesConfig?.whiteLabel?.defaultPortfolio,
  };
};

export const sdkVersion = process.env.WEB3AUTH_VERSION;
