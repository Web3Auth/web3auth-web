import { IWalletAdapter } from "../adapter/IWalletAdapter";

export interface Wallet {
  name: string;
  adapter: () => IWalletAdapter;
}

export const SOLANA_WALLET_ADAPTERS = {
  TORUS_SOLANA_WALLET: "torus-solana-wallet",
  OPENLOGIN_WALLET: "openlogin-wallet",
  PHANTOM_WALLET: "phantom-wallet",
  CUSTOM_AUTH: "custom-auth-wallet",
};

export const EVM_WALLET_ADAPTERS = {
  TORUS_EVM_WALLET: "torus-evm-wallet",
  METAMASK_WALLET: "metamask-wallet",
  OPENLOGIN_WALLET: "openlogin-wallet",
  CUSTOM_AUTH: "custom-auth-wallet",
};

export const WALLET_ADAPTERS = {
  ...EVM_WALLET_ADAPTERS,
  ...SOLANA_WALLET_ADAPTERS,
};

export type WALLET_ADAPTER_TYPE = typeof WALLET_ADAPTERS[keyof typeof WALLET_ADAPTERS];
export type SOLANA_ADAPTER_TYPE = typeof SOLANA_WALLET_ADAPTERS[keyof typeof SOLANA_WALLET_ADAPTERS];
export type EVM_ADAPTER_TYPE = typeof EVM_WALLET_ADAPTERS[keyof typeof EVM_WALLET_ADAPTERS];

export const OPENLOGIN_WALLET_ADAPTERS = {
  OPENLOGIN_WALLET: "openlogin-wallet",
};
export type OPENLOGIN_ADAPTER_TYPE = typeof OPENLOGIN_WALLET_ADAPTERS[keyof typeof OPENLOGIN_WALLET_ADAPTERS];
