import { JRPCRequest, SafeEventEmitter } from "packages/adapters/torus-evm-adapter/node_modules/@toruslabs/openlogin-jrpc/dist/types";

export type SendCallBack<U> = (err: any, providerRes: U) => void;
export interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export type Maybe<T> = Partial<T> | null | undefined;

export interface SafeEventEmitterProvider extends SafeEventEmitter {
  sendAsync: <T, U>(req: JRPCRequest<T>) => Promise<U>;
  send: <T, U>(req: JRPCRequest<T>, callback: SendCallBack<U>) => void;
  request?: <T>(args: RequestArguments) => Promise<Maybe<T>>;
}

export const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored",
};
