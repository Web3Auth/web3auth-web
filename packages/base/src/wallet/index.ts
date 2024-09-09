export const MULTI_CHAIN_ADAPTERS = {
  AUTH: "auth",
  WALLET_CONNECT_V2: "wallet-connect-v2",
  SFA: "sfa",
};

export const SOLANA_ADAPTERS = {
  TORUS_SOLANA: "torus-solana",
  PHANTOM: "phantom",
  SOLFLARE: "solflare",
  ...MULTI_CHAIN_ADAPTERS,
};

export const EVM_ADAPTERS = {
  TORUS_EVM: "torus-evm",
  METAMASK: "metamask",
  COINBASE: "coinbase",
  ...MULTI_CHAIN_ADAPTERS,
};

export const WALLET_ADAPTERS = {
  ...EVM_ADAPTERS,
  ...SOLANA_ADAPTERS,
};
export type WALLET_ADAPTER_TYPE = (typeof WALLET_ADAPTERS)[keyof typeof WALLET_ADAPTERS];
export type SOLANA_ADAPTER_TYPE = (typeof SOLANA_ADAPTERS)[keyof typeof SOLANA_ADAPTERS];
export type EVM_ADAPTER_TYPE = (typeof EVM_ADAPTERS)[keyof typeof EVM_ADAPTERS];
export type MULTI_CHAIN_ADAPTER_TYPE = (typeof MULTI_CHAIN_ADAPTERS)[keyof typeof MULTI_CHAIN_ADAPTERS];

export const ADAPTER_NAMES = {
  [MULTI_CHAIN_ADAPTERS.AUTH]: "Auth",
  [MULTI_CHAIN_ADAPTERS.WALLET_CONNECT_V2]: "Wallet Connect v2",
  [MULTI_CHAIN_ADAPTERS.SFA]: "SFA",
  [SOLANA_ADAPTERS.TORUS_SOLANA]: "Torus",
  [SOLANA_ADAPTERS.PHANTOM]: "Phantom",
  [SOLANA_ADAPTERS.SOLFLARE]: "Solflare",
  [EVM_ADAPTERS.TORUS_EVM]: "Torus",
  [EVM_ADAPTERS.METAMASK]: "Metamask",
  [EVM_ADAPTERS.COINBASE]: "Coinbase",
};
