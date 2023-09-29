import type { SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";
import type { CustomChainConfig } from "@web3auth-mpc/base";
export interface IBaseProvider<T> {
  provider: SafeEventEmitterProvider | null;
  setupProvider(provider: T): Promise<void>;
  addChain(chainConfig: CustomChainConfig): void;
  switchChain(params: { chainId: string }): Promise<void>;
}
