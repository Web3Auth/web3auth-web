import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
export interface UIConfig {
    appLogo: string;
    version: string;
    adapterListener: SafeEventEmitter;
    isDark?: boolean;
}
export declare const LOGIN_MODAL_EVENTS: {
    INIT_EXTERNAL_WALLETS: string;
    LOGIN: string;
    DISCONNECT: string;
};
