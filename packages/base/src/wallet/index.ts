import { IWalletAdapter } from "../adapter/IWalletAdapter";

export interface Wallet {
  name: string;
  adapter: () => IWalletAdapter;
}

export const SOLANA_WALLET_ADAPTERS = {
  TORUS_SOLANA_WALLET: "torus-solana-wallet",
  PHANTOM_WALLET: "phantom-wallet",
};

export const EVM_WALLET_ADAPTERS = {
  TORUS_EVM_WALLET: "torus-evm-wallet",
  METAMASK_WALLET: "metamask-wallet",
  WALLET_CONNECT_V1: "wallet-connect-v1",
};

export const MULTICHAIN_WALLETS = {
  OPENLOGIN_WALLET: "openlogin-wallet",
  CUSTOM_AUTH: "custom-auth-wallet",
  WALLET_CONNECT_V2: "wallet-connect-v2",
};

export const WALLET_ADAPTERS = {
  ...EVM_WALLET_ADAPTERS,
  ...SOLANA_WALLET_ADAPTERS,
  ...MULTICHAIN_WALLETS,
};

export type WALLET_ADAPTER_TYPE = typeof WALLET_ADAPTERS[keyof typeof WALLET_ADAPTERS];
export type SOLANA_ADAPTER_TYPE = typeof SOLANA_WALLET_ADAPTERS[keyof typeof SOLANA_WALLET_ADAPTERS];
export type EVM_ADAPTER_TYPE = typeof EVM_WALLET_ADAPTERS[keyof typeof EVM_WALLET_ADAPTERS];

export const OPENLOGIN_WALLET_ADAPTERS = {
  OPENLOGIN_WALLET: "openlogin-wallet",
};
export type OPENLOGIN_ADAPTER_TYPE = typeof OPENLOGIN_WALLET_ADAPTERS[keyof typeof OPENLOGIN_WALLET_ADAPTERS];
