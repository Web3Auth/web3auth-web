import type { SafeEventEmitterProvider } from "@toruslabs/base-controllers";

export interface IBaseProvider<T> {
  provider: SafeEventEmitterProvider | null;
  setupProvider(provider: T): Promise<SafeEventEmitterProvider>;
}
