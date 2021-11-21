import { JRPCRequest, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

export type SendCallBack<U> = (err: any, providerRes: U) => void;

export interface SafeEventEmitterProvider extends SafeEventEmitter {
  sendAsync: <T, U>(req: JRPCRequest<T>) => Promise<U>;
  send: <T, U>(req: JRPCRequest<T>, callback: SendCallBack<U>) => void;
}

export const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored",
};
