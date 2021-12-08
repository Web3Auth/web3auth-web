import { IWalletAdapter, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { SolanaWalletOptions } from "@web3auth/solana-wallet-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-wallet-adapter";

export const getModule = async (name: WALLET_ADAPTER_TYPE, options: unknown): Promise<IWalletAdapter> => {
  if (name === WALLET_ADAPTERS.TORUS_EVM_WALLET) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-wallet-adapter");
    const adapter = new TorusWalletAdapter({ ...(options as TorusWalletOptions) });
    return adapter;
  } else if (name === WALLET_ADAPTERS.TORUS_SOLANA_WALLET) {
    const { SolanaWalletAdapter } = await import("@web3auth/solana-wallet-adapter");
    const adapter = new SolanaWalletAdapter({ ...(options as SolanaWalletOptions) });
    return adapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN_WALLET) {
    const { OpenloginAdapter } = await import("@web3auth/openlogin-adapter");
    const adapter = new OpenloginAdapter({ ...(options as OpenloginAdapterOptions) });
    return adapter;
  } else if (name === WALLET_ADAPTERS.METAMASK_WALLET) {
    const { MetamaskAdapter } = await import("@web3auth/metamask-wallet-adapter");
    const adapter = new MetamaskAdapter();
    return adapter;
  } else if (name === WALLET_ADAPTERS.PHANTOM_WALLET) {
    const { PhantomAdapter } = await import("@web3auth/phantom-wallet-adapter");
    const adapter = new PhantomAdapter();
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
