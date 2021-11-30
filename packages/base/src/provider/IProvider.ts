import { JRPCRequest, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

export type SendCallBack<U> = (err: any, providerRes: U) => void;
interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export interface SafeEventEmitterProvider extends SafeEventEmitter {
  sendAsync: <T, U>(req: JRPCRequest<T>) => Promise<U>;
  send: <T, U>(req: JRPCRequest<T>, callback: SendCallBack<U>) => void;
  request?: (args: RequestArguments) => Promise<unknown>;
}

export const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored",
};
