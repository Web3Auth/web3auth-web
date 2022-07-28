import { SafeEventEmitterProvider } from "@web3auth/base";
import starkexProvider from "./starkexProvider";

export interface IWalletProvider {
  getStarkAccount: () => Promise<any>;
  getStarkKey: () => Promise<any>;
  onMintRequest: () => Promise<void>;
  onDepositRequest: () => Promise<void>;
  onWithdrawalRequest: () => Promise<void>;
}

export const getWalletProvider = (chain: string, provider: SafeEventEmitterProvider, uiConsole: any): IWalletProvider => {
  return starkexProvider(provider, uiConsole);
};
