import type {
  AUTH_CONNECTION_TYPE,
  EMAIL_FLOW_TYPE,
  ExtraLoginOptions,
  LANGUAGES,
  SafeEventEmitter,
  THEME_MODE_TYPE,
  WEB3AUTH_NETWORK_TYPE,
} from "@web3auth/auth";
import {
  type AuthLoginParams,
  type BaseConnectorConfig,
  type ChainNamespaceType,
  type LoginMethodConfig,
  type UIConfig as CoreUIConfig,
  type WALLET_CONNECTOR_TYPE,
  type WalletRegistry,
  type WalletRegistryItem,
  type Web3AuthNoModalEvents,
} from "@web3auth/no-modal";

export enum WIDGET_TYPE {
  MODAL = "modal",
  EMBED = "embed",
}

export type WidgetType = (typeof WIDGET_TYPE)[keyof typeof WIDGET_TYPE];

// capture whitelabel only once
export interface UIConfig extends CoreUIConfig {
  /**
   * Whether to use the modal or embed widget
   *
   * @defaultValue `modal`
   */
  widget?: WidgetType;

  /**
   * ID of the element to embed the widget into
   */
  targetId?: string;

  /**
   * order of how login methods are shown
   *
   * @defaultValue `["google", "facebook", "twitter", "reddit", "discord", "twitch", "apple", "line", "github", "kakao", "linkedin", "weibo", "wechat", "email_passwordless"]`
   */
  loginMethodsOrder?: string[];

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
   * Decides which button will be the focus of the modal
   * For `socialLogin` the social icon will be colored
   * For other options like `emailLogin` and `externalLogin` the respective buttons will be converted into a primary button
   *
   * @defaultValue `socialLogin`
   */
  primaryButton?: "externalLogin" | "socialLogin" | "emailLogin";

  connectorListener: SafeEventEmitter<Web3AuthNoModalEvents>;
}

export type ModalLoginParams = Pick<
  AuthLoginParams,
  "authConnection" | "authConnectionId" | "groupedAuthConnectionId" | "login_hint" | "extraLoginOptions"
> & {
  name: string;
};

export interface LoginModalProps extends UIConfig {
  chainNamespaces: ChainNamespaceType[];
  walletRegistry: WalletRegistry;
  web3authClientId: string;
  web3authNetwork: WEB3AUTH_NETWORK_TYPE;
}

export interface LoginModalCallbacks {
  onInitExternalWallets: (params: { externalWalletsInitialized: boolean }) => Promise<void>;
  onSocialLogin: (params: { connector: WALLET_CONNECTOR_TYPE; loginParams: ModalLoginParams }) => Promise<void>;
  onExternalWalletLogin: (params: { connector: WALLET_CONNECTOR_TYPE; loginParams: { chainNamespace: ChainNamespaceType } }) => Promise<void>;
  onModalVisibility: (visibility: boolean) => Promise<void>;
}

export const LOGIN_MODAL_EVENTS = {
  MODAL_VISIBILITY: "MODAL_VISIBILITY",
} as const;
export type SocialLoginsConfig = {
  loginMethodsOrder: string[];
  loginMethods: LoginMethodConfig;
  connector: WALLET_CONNECTOR_TYPE;
  uiConfig: Omit<UIConfig, "connectorListener">;
};

export const MODAL_STATUS = {
  INITIALIZED: "initialized",
  CONNECTED: "connected",
  CONNECTING: "connecting",
  ERRORED: "errored",
} as const;
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
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
  detailedLoaderConnector: string;
  detailedLoaderConnectorName: string;
  showExternalWalletsOnly: boolean;
  currentPage?: string;
  web3authClientId: string;
  web3authNetwork: WEB3AUTH_NETWORK_TYPE;
}

export type SocialLoginEventType = { connector: string; loginParams: ModalLoginParams };
export type ExternalWalletEventType = { connector: string; chainNamespace?: ChainNamespaceType };

export const DEFAULT_LOGO_LIGHT = "https://images.web3auth.io/web3auth-logo-w.svg"; // logo used on light mode
export const DEFAULT_LOGO_DARK = "https://images.web3auth.io/web3auth-logo-w-light.svg"; // logo used on dark mode

export const WALLET_CONNECT_LOGO = "https://images.web3auth.io/login-wallet-connect.svg";

export type StateEmitterEvents = {
  STATE_UPDATED: (state: Partial<ModalState>) => void;
  MOUNTED: () => void;
};

export type ExternalButton = {
  name: string;
  displayName?: string;
  href?: string;
  hasInjectedWallet: boolean;
  hasWalletConnect: boolean;
  hasInstallLinks: boolean;
  walletRegistryItem?: WalletRegistryItem;
  imgExtension?: string;
  chainNamespaces?: ChainNamespaceType[];
};

export type os = "iOS" | "Android";
export type platform = "mobile" | "desktop" | "tablet";
export type browser = "chrome" | "firefox" | "edge" | "safari" | "brave";
export type mobileOs = "ios" | "android";

export type rowType = {
  method: string;
  isDark: boolean;
  isPrimaryBtn: boolean;
  name: string;
  adapter: SocialLoginsConfig["connector"];
  loginParams: {
    authConnection: AUTH_CONNECTION_TYPE;
    name: string;
    login_hint: string;
    authConnectionId?: string;
    groupedAuthConnectionId?: string;
    extraLoginOptions?: ExtraLoginOptions;
  };
  order: number;
  isMainOption: boolean;
};

export type PasswordlessHandlerParams = {
  authConnection: AUTH_CONNECTION_TYPE;
  web3authClientId: string;
  clientId: string;
  loginHint: string;
  network: string;
  uiConfig?: Omit<UIConfig, "connectorListener">;
};

export interface WhiteLabelParams {
  name?: string;
  url?: string;
  language?: keyof typeof LANGUAGES;
  theme?: Record<string, string>;
  logo?: string;
  mode?: THEME_MODE_TYPE;
}

export interface CodeInitiateRequestBodyParams {
  client_id: string;
  connection: "email" | "sms";
  login_hint: string;
  web3auth_client_id: string;
  tracking_id?: string;
  whitelabel?: WhiteLabelParams;
  version?: string;
  network?: string;
  flow_type?: EMAIL_FLOW_TYPE;
  captcha_token?: string;
}

export interface CodeVerifyRequestBodyParams {
  client_id: string;
  login_hint: string;
  code: string;
  connection: "email" | "sms";
  tracking_id: string;
  version?: string;
  network?: string;
  flow_type?: EMAIL_FLOW_TYPE;
}

export type IStartResponse = {
  success?: boolean;
  message: string;
  error?: string;
  data?: { trackingId: string };
};
