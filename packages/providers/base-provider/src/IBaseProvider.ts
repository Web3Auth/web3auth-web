import type { SafeEventEmitterProvider } from "@toruslabs/base-controllers";

export interface IBaseProvider<T> {
  setupProvider(provider: T): Promise<SafeEventEmitterProvider>;
}
