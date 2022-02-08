import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

export interface UIConfig {
  appLogo: string;
  version: string;
  adapterListener: SafeEventEmitter;
  theme?: "light" | "dark";
  loginMethodsOrder?: string[];
}
export const LOGIN_MODAL_EVENTS = {
  INIT_EXTERNAL_WALLETS: "INIT_EXTERNAL_WALLETS",
  LOGIN: "LOGIN",
  DISCONNECT: "DISCONNECT",
  MODAL_VISIBILITY: "MODAL_VISIBILITY",
};
