import { Wallet } from "@web3auth/base";
import { CustomauthAdapter, CustomauthAdapterOptions } from "@web3auth/customauth-adapter";
import { MetamaskAdapter } from "@web3auth/metamask-adapter";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { PhantomAdapter } from "@web3auth/phantom-adapter";
import { TorusWalletAdapter, TorusWalletOptions } from "@web3auth/torus-evm-adapter";
import { SolanaWalletAdapter, SolanaWalletOptions } from "@web3auth/torus-solana-adapter";

import { WALLET_ADAPTERS } from "../constants";

const getTorusEvmWallet = (params: TorusWalletOptions): Wallet<unknown> => {
  return {
    name: WALLET_ADAPTERS.TORUS_EVM,
    adapter: () => {
      const torusAdapter = new TorusWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getTorusSolanaWallet = (params: SolanaWalletOptions): Wallet<unknown> => {
  return {
    name: WALLET_ADAPTERS.TORUS_SOLANA,
    adapter: () => {
      const torusAdapter = new SolanaWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getOpenloginWallet = (params: OpenloginAdapterOptions): Wallet<unknown> => {
  return {
    name: WALLET_ADAPTERS.OPENLOGIN,
    adapter: () => {
      const torusAdapter = new OpenloginAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getCustomauthWallet = (params: CustomauthAdapterOptions): Wallet<unknown> => {
  return {
    name: WALLET_ADAPTERS.CUSTOM_AUTH,
    adapter: () => {
      const torusAdapter = new CustomauthAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getMetamaskWallet = (): Wallet<unknown> => {
  return {
    name: WALLET_ADAPTERS.METAMASK,
    adapter: () => {
      const adapter = new MetamaskAdapter();
      return adapter;
    },
  };
};

const getPhantomWallet = (): Wallet<unknown> => {
  return {
    name: WALLET_ADAPTERS.PHANTOM,
    adapter: () => {
      const adapter = new PhantomAdapter();
      return adapter;
    },
  };
};

export { getCustomauthWallet, getMetamaskWallet, getOpenloginWallet, getPhantomWallet, getTorusEvmWallet, getTorusSolanaWallet };
