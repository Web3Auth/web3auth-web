import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

export interface UIConfig {
  appLogo: string;
  version: string;
  adapterListener: SafeEventEmitter;
  isDark?: boolean;
}
export const LOGIN_MODAL_EVENTS = {
  INIT_EXTERNAL_WALLETS: "INIT_EXTERNAL_WALLETS",
  LOGIN: "LOGIN",
  DISCONNECT: "DISCONNECT",
};
