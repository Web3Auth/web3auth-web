import { CHAIN_NAMESPACES, type ChainNamespaceType } from "@toruslabs/base-controllers";

export { CHAIN_NAMESPACES, type ChainNamespaceType };

export const CONNECTOR_NAMESPACES = {
  EIP155: "eip155",
  SOLANA: "solana",
  CASPER: "casper",
  XRPL: "xrpl",
  MULTICHAIN: "multichain",
} as const;
// eip155 for all evm chains
export type ConnectorNamespaceType = (typeof CONNECTOR_NAMESPACES)[keyof typeof CONNECTOR_NAMESPACES];

export type CustomChainConfig = {
  chainNamespace: ChainNamespaceType;
  /**
   * The chain id of the chain
   */
  chainId: string;
  /**
   * RPC target Url for the chain
   */
  rpcTarget: string;

  /**
   * web socket target Url for the chain
   */
  wsTarget?: string;

  /**
   * Display Name for the chain
   */
  displayName?: string;
  /**
   * Url of the block explorer
   */
  blockExplorerUrl?: string;
  /**
   * Default currency ticker of the network (e.g: ETH)
   */
  ticker?: string;
  /**
   * Name for currency ticker (e.g: `Ethereum`)
   */
  tickerName?: string;
  /**
   * Number of decimals for the currency ticker (e.g: 18)
   */
  decimals?: number;
  /**
   * Logo for the token
   */
  logo?: string;
  /**
   * Whether the network is testnet or not
   */
  isTestnet?: boolean;
};
