import { Wallet } from "@web3auth/base";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { SolanaWalletAdapter, SolanaWalletOptions } from "@web3auth/solana-wallet-adapter";
import { TorusWalletAdapter } from "@web3auth/torus-wallet-adapter";

import { WALLET_ADAPTERS } from "../constants";
import { TorusWalletOptions } from "../interface";

const getTorusEvmWallet = (params: TorusWalletOptions): Wallet => {
  return {
    name: WALLET_ADAPTERS.TORUS_EVM_WALLET,
    adapter: () => {
      const torusAdapter = new TorusWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getTorusSolanaWallet = (params: SolanaWalletOptions): Wallet => {
  return {
    name: WALLET_ADAPTERS.TORUS_SOLANA_WALLET,
    adapter: () => {
      const torusAdapter = new SolanaWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getOpenloginWallet = (params: OpenloginAdapterOptions): Wallet => {
  return {
    name: WALLET_ADAPTERS.OPENLOGIN_WALLET,
    adapter: () => {
      const torusAdapter = new OpenloginAdapter({ ...params });
      return torusAdapter;
    },
  };
};

export { getOpenloginWallet, getTorusEvmWallet, getTorusSolanaWallet };
