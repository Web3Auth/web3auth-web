import { IWalletAdapter } from "../adapter/IWalletAdapter";

export interface Wallet {
  name: string;
  adapter: () => IWalletAdapter;
}

export const WALLET_ADAPTERS = {
  TORUS_EVM_WALLET: "torus-evm-wallet",
  TORUS_SOLANA_WALLET: "torus-solana-wallet",
  OPENLOGIN_WALLET: "openlogin-wallet",
};

export type WALLET_ADAPTER_TYPE = typeof WALLET_ADAPTERS[keyof typeof WALLET_ADAPTERS];
