import { getXRPLChainConfig } from "@web3auth/xrpl-provider";

export const CHAIN_CONFIG = {
  "xrpl-devnet": getXRPLChainConfig("devnet"),
  "xrpl-testnet": getXRPLChainConfig("testnet"),
  "xrpl-mainnet": getXRPLChainConfig("mainnet"),
} as const;

export type CHAIN_CONFIG_TYPE = keyof typeof CHAIN_CONFIG;
