import type { Adapter } from "@web3auth/base";
import type { CustomAuthAdapterOptions } from "@web3auth/customauth-adapter";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-evm-adapter";
import type { SolanaWalletOptions } from "@web3auth/torus-solana-adapter";

import { WALLET_ADAPTERS } from "../constants";

const getTorusEvmAdapter = async (params: TorusWalletOptions): Promise<Adapter<unknown>> => {
  const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
  return {
    name: WALLET_ADAPTERS.TORUS_EVM,
    adapter: () => {
      const torusAdapter = new TorusWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getTorusSolanaAdapter = async (params: SolanaWalletOptions): Promise<Adapter<unknown>> => {
  const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
  return {
    name: WALLET_ADAPTERS.TORUS_SOLANA,
    adapter: () => {
      const torusAdapter = new SolanaWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getOpenloginAdapter = async (params: OpenloginAdapterOptions): Promise<Adapter<unknown>> => {
  const { OpenloginAdapter } = await import("@web3auth/openlogin-adapter");
  return {
    name: WALLET_ADAPTERS.OPENLOGIN,
    adapter: () => {
      const torusAdapter = new OpenloginAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getCustomAuthAdapter = async (params: CustomAuthAdapterOptions): Promise<Adapter<unknown>> => {
  const { CustomauthAdapter } = await import("@web3auth/customauth-adapter");

  return {
    name: WALLET_ADAPTERS.CUSTOM_AUTH,
    adapter: () => {
      const torusAdapter = new CustomauthAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getMetamaskAdapter = async (): Promise<Adapter<unknown>> => {
  const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
  return {
    name: WALLET_ADAPTERS.METAMASK,
    adapter: () => {
      const adapter = new MetamaskAdapter();
      return adapter;
    },
  };
};

const getPhantomAdapter = async (): Promise<Adapter<unknown>> => {
  const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
  return {
    name: WALLET_ADAPTERS.PHANTOM,
    adapter: () => {
      const adapter = new PhantomAdapter();
      return adapter;
    },
  };
};

export { getCustomAuthAdapter, getMetamaskAdapter, getOpenloginAdapter, getPhantomAdapter, getTorusEvmAdapter, getTorusSolanaAdapter };
