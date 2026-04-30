import type {
  AUTH_CONNECTION_TYPE,
  BUILD_ENV_TYPE,
  EMAIL_FLOW_TYPE,
  ExtraLoginOptions,
  LANGUAGES,
  SafeEventEmitter,
  THEME_MODE_TYPE,
  WEB3AUTH_NETWORK_TYPE,
} from "@web3auth/auth";
import {
  type Analytics,
  type AuthLoginParams,
  type BaseConnectorConfig,
  type ChainNamespaceType,
  type ConnectorInitialAuthenticationModeType,
  type LoginMethodConfig,
  type LoginModalConfig,
  type UIConfig as CoreUIConfig,
  type WALLET_CONNECTOR_TYPE,
  type WalletRegistry,
  type WalletRegistryItem,
  type Web3AuthNoModalEvents,
} from "@web3auth/no-modal";

// capture whitelabel only once
export interface UIConfig extends CoreUIConfig, LoginModalConfig {
  /**
   * ID of the element to embed the widget into
   */
  targetId?: string;

  /**
   * order of how login methods are shown
   *
   * @defaultValue `["google", "facebook", "twitter", "reddit", "discord", "twitch", "apple", "line", "github", "kakao", "linkedin", "wechat", "email_passwordless"]`
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

  /**
   * Whether to hide the success screen after login.
   * When true, the modal will close immediately after successful login.
   * When false, a success screen will be shown briefly (1 second for social logins).
   *
   * @defaultValue `false`
   */
  hideSuccessScreen?: boolean;

  connectorListener: SafeEventEmitter<Web3AuthNoModalEvents>;

  /**
   * Config for consent required.
   *
   * @defaultValue `undefined`
   */
  consentConfig?: {
    required: boolean;
  };
}

export type ModalLoginParams = Pick<
  AuthLoginParams,
  "authConnection" | "authConnectionId" | "groupedAuthConnectionId" | "loginHint" | "extraLoginOptions"
> & {
  name: string;
};

export interface LoginModalProps extends UIConfig {
  initialAuthenticationMode: ConnectorInitialAuthenticationModeType;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry: WalletRegistry;
  web3authClientId: string;
  web3authNetwork: WEB3AUTH_NETWORK_TYPE;
  authBuildEnv: BUILD_ENV_TYPE;
  analytics: Analytics;
}

export interface LoginModalCallbacks {
  onInitExternalWallets: (params: { externalWalletsInitialized: boolean }) => Promise<void>;
  onSocialLogin: (params: { loginParams: ModalLoginParams }) => Promise<void>;
  onExternalWalletLogin: (params: {
    connector: WALLET_CONNECTOR_TYPE | string;
    loginParams: { chainNamespace: ChainNamespaceType };
  }) => Promise<void>;
  onModalVisibility: (visibility: boolean) => Promise<void>;
  onMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => Promise<void>;
  onAcceptConsent: () => Promise<void>;
  onDeclineConsent: () => Promise<void>;
}

export const LOGIN_MODAL_EVENTS = {
  MODAL_VISIBILITY: "MODAL_VISIBILITY",
} as const;
export type SocialLoginsConfig = {
  loginMethodsOrder: string[];
  loginMethods: LoginMethodConfig;
  uiConfig: Omit<UIConfig, "connectorListener">;
};

export const MODAL_STATUS = {
  INITIALIZED: "initialized",
  CONNECTED: "connected",
  CONNECTING: "connecting",
  ERRORED: "errored",
  AUTHORIZING: "authorizing",
  AUTHORIZED: "authorized",
  CONSENT_REQUIRING: "consent_requiring",
} as const;
export type ModalStatusType = (typeof MODAL_STATUS)[keyof typeof MODAL_STATUS];

export const ACCOUNT_LINKING_STATUS = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  AWAITING_CONNECTION: "awaiting_connection",
  WALLET_CONNECTED: "wallet_connected",
  LINKING: "linking",
  ERRORED: "errored",
  COMPLETED: "completed",
} as const;
export type AccountLinkingStatusType = (typeof ACCOUNT_LINKING_STATUS)[keyof typeof ACCOUNT_LINKING_STATUS];

export const ACCOUNT_LINKING_INTENT = {
  LINK: "link",
  SWITCH: "switch",
} as const;
export type AccountLinkingIntentType = (typeof ACCOUNT_LINKING_INTENT)[keyof typeof ACCOUNT_LINKING_INTENT];

export interface AccountLinkingState {
  active: boolean;
  /**
   * True when the modal is showing the wallet picker for `linkAccount()` called
   * without a `connectorName`. The user's selection in the ConnectWallet UI will
   * be routed to the linking flow instead of the regular login flow.
   */
  pickerActive: boolean;
  /**
   * The name of the wallet to be linked to.
   */
  connectorName: WALLET_CONNECTOR_TYPE | string | null;
  /**
   * The underlying actual connector that is used to connect to the target account.
   * This is different from the connectorName coz except for Metamask, others wallet can be used to connect with injectedEvmConnector/solanaStandardWalletConnector if installed.
   * Otherwise, will fallback to the wallet-connect connector.
   *
   * This is useful when we want to rehydrate the linked account, using this transport connector to connect back to the target account.
   **/
  transportConnectorName: WALLET_CONNECTOR_TYPE | string | null;
  chainId: string | null;
  intent: AccountLinkingIntentType;
  status: AccountLinkingStatusType;
  walletConnectUri?: string;
  errorMessage: string;
}

export const DEFAULT_ACCOUNT_LINKING_STATE: AccountLinkingState = {
  active: false,
  pickerActive: false,
  connectorName: null,
  transportConnectorName: null,
  chainId: null,
  intent: ACCOUNT_LINKING_INTENT.LINK,
  status: ACCOUNT_LINKING_STATUS.IDLE,
  errorMessage: "",
};

export interface ModalState {
  // UI State - changes frequently during user interaction
  status: ModalStatusType;
  modalVisibility: boolean;
  externalWalletsVisibility: boolean;
  currentPage?: string;

  // Loading State - changes during async operations
  postLoadingMessage: string;
  detailedLoaderConnector: string;
  detailedLoaderConnectorName: string;

  // External Wallets State - wallet-specific, changes less often
  hasExternalWallets: boolean;
  externalWalletsInitialized: boolean;
  showExternalWalletsOnly: boolean;
  walletConnectUri: string;
  metamaskConnectUri: string;
  accountLinking: AccountLinkingState;

  // Config State - set during initialization, rarely changes
  socialLoginsConfig: SocialLoginsConfig;
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
}

export type SocialLoginEventType = { loginParams: ModalLoginParams };
export type ExternalWalletEventType = { connector: WALLET_CONNECTOR_TYPE | string; chainNamespace?: ChainNamespaceType };

export type StateEmitterEvents = {
  STATE_UPDATED: (state: Partial<ModalState>) => void;
  MOUNTED: () => void;
};

export type ExternalButton = {
  name: string;
  displayName?: string;
  href?: string;
  icon?: string;
  isInstalled?: boolean;
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
  description: string;
  method: string;
  isDark: boolean;
  isPrimaryBtn: boolean;
  name: string;
  loginParams: {
    authConnection: AUTH_CONNECTION_TYPE;
    name: string;
    login_hint: string;
    authConnectionId?: string;
    groupedAuthConnectionId?: string;
    extraLoginOptions?: ExtraLoginOptions;
  };
  order: number;
  mainOption?: boolean;
};

export type PasswordlessHandlerParams = {
  authConnection: AUTH_CONNECTION_TYPE;
  web3authClientId: string;
  loginHint: string;
  network: string;
  authBuildEnv?: BUILD_ENV_TYPE;
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
  error?: string;
  data?: { trackingId: string };
};

export type IVerifyResponse = {
  success?: boolean;
  error?: string;
  data?: { id_token: string };
};

export type LogoAlignmentType = UIConfig["logoAlignment"];
export type BorderRadiusType = UIConfig["borderRadiusType"];
export type ButtonRadiusType = UIConfig["buttonRadiusType"];

export enum TOAST_TYPE {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export type ToastType = (typeof TOAST_TYPE)[keyof typeof TOAST_TYPE];

export interface ValidatePhoneNumberApiResponse {
  success: boolean;
  parsed_number: string;
  country_flag: string;
}
