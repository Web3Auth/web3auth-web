import type { SafeEventEmitterProvider } from "@web3auth/base";

export interface IBaseProvider<T> extends SafeEventEmitterProvider {
  setupProvider(provider: T): Promise<void>;
}
