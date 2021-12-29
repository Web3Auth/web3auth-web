import { IAdapter, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-evm-adapter";
import type { SolanaWalletOptions } from "@web3auth/torus-solana-adapter";

export const getModule = async (name: WALLET_ADAPTER_TYPE, options: unknown): Promise<IAdapter<unknown>> => {
  if (name === WALLET_ADAPTERS.TORUS_EVM) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
    const adapter = new TorusWalletAdapter({ ...(options as TorusWalletOptions) });
    return adapter;
  } else if (name === WALLET_ADAPTERS.TORUS_SOLANA) {
    const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
    const adapter = new SolanaWalletAdapter({ ...(options as SolanaWalletOptions) });
    return adapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
    const { OpenloginAdapter } = await import("@web3auth/openlogin-adapter");
    const adapter = new OpenloginAdapter({ ...(options as OpenloginAdapterOptions) });
    return adapter;
  } else if (name === WALLET_ADAPTERS.METAMASK) {
    const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
    const adapter = new MetamaskAdapter();
    return adapter;
  } else if (name === WALLET_ADAPTERS.PHANTOM) {
    const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
    const adapter = new PhantomAdapter();
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
