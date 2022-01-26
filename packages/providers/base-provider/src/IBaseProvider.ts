import type { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";

export interface IBaseProvider<T> extends SafeEventEmitterProvider {
  setupProvider(provider: T): Promise<void>;
  addChain(chainConfig: CustomChainConfig): void;
  switchChain(params: { chainId: string }): Promise<void>;
}
