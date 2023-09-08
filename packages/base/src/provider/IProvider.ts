export { type SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";

export type SendCallBack<U> = (err: unknown, providerRes: U) => void;
export interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export type Maybe<T> = T | Partial<T> | null | undefined;

export const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored",
};
