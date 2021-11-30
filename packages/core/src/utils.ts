import { IWalletAdapter, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { SolanaWalletOptions } from "@web3auth/solana-wallet-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-wallet-adapter";

export const getModule = async (name: WALLET_ADAPTER_TYPE, options: unknown): Promise<IWalletAdapter> => {
  if (name === WALLET_ADAPTERS.TORUS_EVM_WALLET) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-wallet-adapter");
    const torusAdapter = new TorusWalletAdapter({ ...(options as TorusWalletOptions) });
    return torusAdapter;
  } else if (name === WALLET_ADAPTERS.TORUS_SOLANA_WALLET) {
    const { SolanaWalletAdapter } = await import("@web3auth/solana-wallet-adapter");
    const torusAdapter = new SolanaWalletAdapter({ ...(options as SolanaWalletOptions) });
    return torusAdapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN_WALLET) {
    const { OpenloginAdapter } = await import("@web3auth/openlogin-adapter");
    const torusAdapter = new OpenloginAdapter({ ...(options as OpenloginAdapterOptions) });
    return torusAdapter;
  }
};
