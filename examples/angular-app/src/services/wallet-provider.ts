import { SafeEventEmitterProvider } from "@web3auth/base";

import ethProvider from "./eth-provider";
import solanaProvider from "./solana-provider";

export interface IWalletProvider {
  getAccounts: () => Promise<void>;
  getBalance: () => Promise<void>;
  signMessage: () => Promise<void>;
}

export const getWalletProvider = (chain: string, provider: SafeEventEmitterProvider, uiConsole: (...args: unknown[]) => void): IWalletProvider => {
  if (chain === "solana") {
    return solanaProvider(provider, uiConsole);
  }
  return ethProvider(provider, uiConsole);
};
