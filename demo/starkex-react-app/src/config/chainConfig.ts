import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";

export const CHAIN_CONFIG = {
  mainnet: {
    displayName: "StarkEx",
    chainNamespace: CHAIN_NAMESPACES.OTHER,
    tickerName: "StarkEx",
  } as CustomChainConfig,
} as const;

export type CHAIN_CONFIG_TYPE = keyof typeof CHAIN_CONFIG;
