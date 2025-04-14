import { CHAIN_NAMESPACES, cloneDeep } from "@toruslabs/base-controllers";
import { SIGNER_MAP } from "@toruslabs/constants";
import { get } from "@toruslabs/http-helpers";
import { BUILD_ENV_TYPE } from "@web3auth/auth";
import { type Chain } from "viem";

import { CustomChainConfig } from "./chain/IChainInterface";
import { WEB3AUTH_NETWORK, type WEB3AUTH_NETWORK_TYPE } from "./connector";
import type { ProjectConfig, WalletRegistry } from "./interfaces";

export const isHexStrict = (hex: string): boolean => {
  return (typeof hex === "string" || typeof hex === "number") && /^(-)?0x[0-9a-f]*$/i.test(hex);
};

export const signerHost = (web3AuthNetwork?: WEB3AUTH_NETWORK_TYPE): string => {
  return SIGNER_MAP[web3AuthNetwork ?? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET];
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
  // const url = new URL(`${signerHost(web3AuthNetwork)}/api/v2/configuration`);
  // TODO: remove this before production
  const url = new URL("https://test-signer.web3auth.io/api/v2/configuration");
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

export const fromViemChain = fromWagmiChain;

export { cloneDeep };
