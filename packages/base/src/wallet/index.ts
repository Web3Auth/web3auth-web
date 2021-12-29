export const MULTI_CHAIN_ADAPTERS = {
  OPENLOGIN: "openlogin",
  CUSTOM_AUTH: "custom-auth",
};

export const SOLANA_ADAPTERS = {
  TORUS_SOLANA: "torus-solana",
  PHANTOM: "phantom",
  ...MULTI_CHAIN_ADAPTERS,
};

export const EVM_ADAPTERS = {
  TORUS_EVM: "torus-evm",
  METAMASK: "metamask",
  ...MULTI_CHAIN_ADAPTERS,
};

export const WALLET_ADAPTERS = {
  ...EVM_ADAPTERS,
  ...SOLANA_ADAPTERS,
};
export type WALLET_ADAPTER_TYPE = typeof WALLET_ADAPTERS[keyof typeof WALLET_ADAPTERS];
export type SOLANA_ADAPTER_TYPE = typeof SOLANA_ADAPTERS[keyof typeof SOLANA_ADAPTERS];
export type EVM_ADAPTER_TYPE = typeof EVM_ADAPTERS[keyof typeof EVM_ADAPTERS];
export type MULTI_CHAIN_ADAPTER_TYPE = typeof MULTI_CHAIN_ADAPTERS[keyof typeof MULTI_CHAIN_ADAPTERS];
