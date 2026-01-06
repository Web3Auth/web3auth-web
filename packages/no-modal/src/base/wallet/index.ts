export const MULTI_CHAIN_CONNECTORS = {
  AUTH: "auth",
  WALLET_CONNECT_V2: "wallet-connect-v2",
  METAMASK: "metamask",
} as const;

export const SOLANA_CONNECTORS = {
  ...MULTI_CHAIN_CONNECTORS,
} as const;

export const EVM_CONNECTORS = {
  COINBASE: "coinbase",
  ...MULTI_CHAIN_CONNECTORS,
} as const;

export const WALLET_CONNECTORS = {
  ...EVM_CONNECTORS,
  ...SOLANA_CONNECTORS,
} as const;

export type WALLET_CONNECTOR_TYPE = (typeof WALLET_CONNECTORS)[keyof typeof WALLET_CONNECTORS];
export type SOLANA_CONNECTOR_TYPE = (typeof SOLANA_CONNECTORS)[keyof typeof SOLANA_CONNECTORS];
export type EVM_CONNECTOR_TYPE = (typeof EVM_CONNECTORS)[keyof typeof EVM_CONNECTORS];
export type MULTI_CHAIN_CONNECTOR_TYPE = (typeof MULTI_CHAIN_CONNECTORS)[keyof typeof MULTI_CHAIN_CONNECTORS];

export const CONNECTOR_NAMES = {
  [MULTI_CHAIN_CONNECTORS.AUTH]: "Auth",
  [MULTI_CHAIN_CONNECTORS.WALLET_CONNECT_V2]: "Wallet Connect v2",
  [EVM_CONNECTORS.COINBASE]: "Coinbase",
  [EVM_CONNECTORS.METAMASK]: "MetaMask",
};
