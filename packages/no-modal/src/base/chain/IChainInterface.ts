import { CHAIN_NAMESPACES, type ChainNamespaceType, type ProviderConfig } from "@toruslabs/base-controllers";

export const CONNECTOR_NAMESPACES = {
  EIP155: "eip155",
  SOLANA: "solana",
  CASPER: "casper",
  XRPL: "xrpl",
  MULTICHAIN: "multichain",
} as const;
// eip155 for all evm chains
export type ConnectorNamespaceType = (typeof CONNECTOR_NAMESPACES)[keyof typeof CONNECTOR_NAMESPACES];

export { CHAIN_NAMESPACES, type ChainNamespaceType };
export type CustomChainConfig = ProviderConfig & { fallbackRpcTargets?: string[]; fallbackWsTargets?: string[] };
