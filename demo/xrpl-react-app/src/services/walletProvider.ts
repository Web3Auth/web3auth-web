import { SafeEventEmitterProvider } from "@web3auth/base";
import xrplProvider from "./xrplProvider";

export interface IWalletProvider {
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signAndSendTransaction: () => Promise<void>;
  signTransaction: () => Promise<void>;
  signMessage: () => Promise<void>;
}

export const getWalletProvider = (chain: string, provider: SafeEventEmitterProvider, uiConsole: any): IWalletProvider => {
  return xrplProvider(provider, uiConsole);
};
