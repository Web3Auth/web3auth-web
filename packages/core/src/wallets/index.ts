import { Adapter, WALLET_ADAPTERS } from "@web3auth/base";
import type { CustomAuthAdapterOptions } from "@web3auth/customauth-adapter";
import type { MetamaskAdapterOptions } from "@web3auth/metamask-adapter";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-evm-adapter";
import type { SolanaWalletOptions } from "@web3auth/torus-solana-adapter";
import type { WalletConnectV1AdapterOptions } from "@web3auth/wallet-connect-v1-adapter";

const getTorusEvmAdapter = async (params: TorusWalletOptions): Promise<Adapter<unknown>> => {
  const { TorusWalletAdapter } = await import(/* webpackChunkName: "torus-evm-adapter" */ "@web3auth/torus-evm-adapter");
  return {
    name: WALLET_ADAPTERS.TORUS_EVM,
    adapter: () => {
      const torusAdapter = new TorusWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getTorusSolanaAdapter = async (params: SolanaWalletOptions): Promise<Adapter<unknown>> => {
  const { SolanaWalletAdapter } = await import(/* webpackChunkName: "torus-solana-adapter" */ "@web3auth/torus-solana-adapter");
  return {
    name: WALLET_ADAPTERS.TORUS_SOLANA,
    adapter: () => {
      const torusAdapter = new SolanaWalletAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getOpenloginAdapter = async (params: OpenloginAdapterOptions): Promise<Adapter<unknown>> => {
  const { OpenloginAdapter } = await import(/* webpackChunkName: "openlogin-adapter" */ "@web3auth/openlogin-adapter");
  return {
    name: WALLET_ADAPTERS.OPENLOGIN,
    adapter: () => {
      const adapter = new OpenloginAdapter({ ...params });
      return adapter;
    },
  };
};

const getCustomAuthAdapter = async (params: CustomAuthAdapterOptions): Promise<Adapter<unknown>> => {
  const { CustomauthAdapter } = await import(/* webpackChunkName: "custom-auth-adapter" */ "@web3auth/customauth-adapter");

  return {
    name: WALLET_ADAPTERS.CUSTOM_AUTH,
    adapter: () => {
      const torusAdapter = new CustomauthAdapter({ ...params });
      return torusAdapter;
    },
  };
};

const getMetamaskAdapter = async (params: MetamaskAdapterOptions): Promise<Adapter<unknown>> => {
  const { MetamaskAdapter } = await import(/* webpackChunkName: "metamask-adapter" */ "@web3auth/metamask-adapter");
  return {
    name: WALLET_ADAPTERS.METAMASK,
    adapter: () => {
      const adapter = new MetamaskAdapter({ ...params });
      return adapter;
    },
  };
};

const getPhantomAdapter = async (): Promise<Adapter<unknown>> => {
  const { PhantomAdapter } = await import(/* webpackChunkName: "phantom-adapter" */ "@web3auth/phantom-adapter");
  return {
    name: WALLET_ADAPTERS.PHANTOM,
    adapter: () => {
      const adapter = new PhantomAdapter();
      return adapter;
    },
  };
};

const getWalletConnectV1Adapter = async (params: WalletConnectV1AdapterOptions): Promise<Adapter<unknown>> => {
  const { WalletConnectV1Adapter } = await import(/* webpackChunkName: "wallet-connect-v1-adapter" */ "@web3auth/wallet-connect-v1-adapter");
  return {
    name: WALLET_ADAPTERS.WALLET_CONNECT_V1,
    adapter: () => {
      const adapter = new WalletConnectV1Adapter(params);
      return adapter;
    },
  };
};

export {
  getCustomAuthAdapter,
  getMetamaskAdapter,
  getOpenloginAdapter,
  getPhantomAdapter,
  getTorusEvmAdapter,
  getTorusSolanaAdapter,
  getWalletConnectV1Adapter,
};
