import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { SafeEventEmitterProvider } from "../provider/IProvider";

export const BASE_WALLET_EVENTS = {
  CONNECTED: "connected",
  DISCONNECTED: "connected",
  ERRORED: "errored",
};

export type UserInfo = {
  name: string;
};

export interface IWalletAdapter extends SafeEventEmitter {
  connecting: boolean;
  connected: boolean;
  provider: SafeEventEmitterProvider;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
}
