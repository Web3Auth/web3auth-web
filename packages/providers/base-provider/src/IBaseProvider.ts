import type { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";

export interface IBaseProvider<T> {
  provider: SafeEventEmitterProvider | null;
  currentChainConfig: Partial<CustomChainConfig>;
  setupProvider(provider: T): Promise<void>;
  addChain(chainConfig: CustomChainConfig): void;
  switchChain(params: { chainId: string }): Promise<void>;
}
