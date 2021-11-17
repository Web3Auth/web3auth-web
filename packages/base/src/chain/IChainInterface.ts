export const CHAIN_NAMESPACES = {
  EIP155: "eip155",
  SOLANA: "solana",
} as const;
// eip155 for all evm chains
export type ChainNamespaceType = typeof CHAIN_NAMESPACES[keyof typeof CHAIN_NAMESPACES];

export const ADAPTER_NAMESPACES = {
  EIP155: "eip155",
  SOLANA: "solana",
  MULTICHAIN: "multichain",
} as const;
// eip155 for all evm chains
export type AdapterNamespaceType = typeof ADAPTER_NAMESPACES[keyof typeof ADAPTER_NAMESPACES];

export type TorusEthWalletChainConfig = {
  chainId?: number;

  host: "mainnet" | "rinkeby" | "ropsten" | "kovan" | "goerli" | "localhost" | "matic" | string;

  networkName?: string;
  /**
   * Url of the block explorer
   */
  blockExplorer?: string;
  /**
   * Default currency ticker of the network (e.g: ETH)
   */
  ticker?: string;
  /**
   * Name for currency ticker (e.g: `Ethereum`)
   */
  tickerName?: string;
};

export type TorusSolanaWalletChainConfig = {
  /**
   * Block explorer url for the chain
   */
  blockExplorerUrl: string;
  /**
   * Logo url for the base token
   */
  logo: string;
  /**
   * Name for ticker
   */
  tickerName: string;
  /**
   * Symbol for ticker
   */
  ticker: string;
  /**
   * RPC target Url for the chain
   */
  rpcTarget: string;
  /**
   * Chain Id parameter(hex with 0x prefix) for the network. Mandatory for all networks. (assign one with a map to network identifier for platforms)
   * @defaultValue 'loading'
   */
  chainId: string;
  /**
   * Display name for the network
   */
  displayName: string;
};

export type CustomChainConfig = {
  chainNamespace: ChainNamespaceType;
  chainId?: number;
  /**
   * RPC target Url for the chain
   */
  rpcTarget: string;

  networkName?: string;
  /**
   * Url of the block explorer
   */
  blockExplorer?: string;
  /**
   * Default currency ticker of the network (e.g: ETH)
   */
  ticker?: string;
  /**
   * Name for currency ticker (e.g: `Ethereum`)
   */
  tickerName?: string;
};
