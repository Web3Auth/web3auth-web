import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BaseAdapterConfig, IWalletConnectExtensionAdapter, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";

export interface UIConfig {
  /**
   * App name to display in the UI.
   */
  appName?: string;

  /**
   * Logo for your app.
   */
  appLogo?: string;

  /**
   * theme for the modal
   *
   * @defaultValue `auto`
   */
  theme?: "light" | "dark" | "auto";

  /**
   * order of how login methods are shown
   *
   * @defaultValue `["google", "facebook", "twitter", "reddit", "discord", "twitch", "apple", "line", "github", "kakao", "linkedin", "weibo", "wechat", "email_passwordless"]`
   */
  loginMethodsOrder?: string[];

  /**
   * language which will be used by web3auth. app will use browser language if not specified. if language is not supported it will use "en"
   * en: english
   * de: german
   * ja: japanese
   * ko: korean
   * zh: mandarin
   * es: spanish
   * fr: french
   * pt: portuguese
   *
   */
  defaultLanguage?: string;

  /**
   * Z-index of the modal and iframe
   * @defaultValue 99998
   */
  modalZIndex?: string;

  /**
   * Whether to show errors on Web3Auth modal.
   *
   * @defaultValue `true`
   */
  displayErrorsOnModal?: boolean;

  /**
   * number of columns to display the Social Login buttons
   *
   * @defaultValue `3`
   */
  loginGridCol?: 2 | 3;

  /**
   * decides which button will be displayed as primary button in modal
   * only one button will be primary and other buttons in modal will be secondary
   *
   * @defaultValue `socialLogin`
   */
  primaryButton?: "externalLogin" | "socialLogin" | "emailLogin";

  adapterListener: SafeEventEmitter;
  web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE;
}

export const LOGIN_MODAL_EVENTS = {
  INIT_EXTERNAL_WALLETS: "INIT_EXTERNAL_WALLETS",
  LOGIN: "LOGIN",
  DISCONNECT: "DISCONNECT",
  MODAL_VISIBILITY: "MODAL_VISIBILITY",
};

export type SocialLoginsConfig = {
  loginMethodsOrder: string[];
  loginMethods: LoginMethodConfig;
  adapter: WALLET_ADAPTER_TYPE;
  uiConfig: Omit<UIConfig, "adapterListener">;
};

export const MODAL_STATUS = {
  INITIALIZED: "initialized",
  CONNECTED: "connected",
  CONNECTING: "connecting",
  ERRORED: "errored",
};
export type ModalStatusType = (typeof MODAL_STATUS)[keyof typeof MODAL_STATUS];

export interface ModalState {
  status: ModalStatusType;
  externalWalletsInitialized: boolean;
  hasExternalWallets: boolean;
  externalWalletsVisibility: boolean;
  modalVisibility: boolean;
  modalVisibilityDelayed: boolean;
  postLoadingMessage: string;
  walletConnectUri: string;
  socialLoginsConfig: SocialLoginsConfig;
  externalWalletsConfig: Record<string, BaseAdapterConfig>;
  detailedLoaderAdapter: string;
  detailedLoaderAdapterName: string;
  showExternalWalletsOnly: boolean;
  wcAdapters: IWalletConnectExtensionAdapter[];
}

export type SocialLoginEventType = { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } };
export type ExternalWalletEventType = { adapter: string };

export const DEFAULT_LOGO_LIGHT = "https://images.web3auth.io/web3auth-logo-w-light.svg";
export const DEFAULT_LOGO_DARK = "https://images.web3auth.io/web3auth-logo-w.svg";

export const WALLET_CONNECT_LOGO = "https://images.web3auth.io/login-wallet-connect.svg";
