import { SafeEventEmitterProvider } from "@toruslabs/base-controllers";

export interface IBaseProvider<T> {
  init(provider?: T): void;
  setupProvider(provider: T): SafeEventEmitterProvider;
}
