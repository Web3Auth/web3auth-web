import { JRPCRequest, JRPCResponse, Maybe, RequestArguments, SafeEventEmitter, SendCallBack } from "@toruslabs/openlogin-jrpc";
import { OPENLOGIN_NETWORK, OPENLOGIN_NETWORK_TYPE, OpenloginUserInfo } from "@toruslabs/openlogin-utils";

import { ChainNamespaceType, ConnectorNamespaceType, CustomChainConfig } from "../chain/interface";
import { SafeEventEmitterProvider } from "../provider/IProvider";

export type UserInfo = OpenloginUserInfo;

export type WEB3AUTH_NETWORK_TYPE = OPENLOGIN_NETWORK_TYPE;
export const WEB3AUTH_NETWORK = OPENLOGIN_NETWORK;
export { UX_MODE, type UX_MODE_TYPE } from "@toruslabs/openlogin-utils";

export const CONNECTOR_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app",
} as const;
export type CONNECTOR_CATEGORY_TYPE = (typeof CONNECTOR_CATEGORY)[keyof typeof CONNECTOR_CATEGORY];

export interface ConnectorInitOptions {
  /**
   * Whether to auto connect to the connector based on redirect mode or saved connectors.
   */
  autoConnect?: boolean;
}

export const CONNECTOR_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERRORED: "errored",
} as const;

export const CONNECTOR_EVENTS = {
  ...CONNECTOR_STATUS,
  CONNECTOR_DATA_UPDATED: "connector_data_updated",
  CACHE_CLEAR: "cache_clear",
} as const;

export type CONNECTOR_STATUS_TYPE = (typeof CONNECTOR_STATUS)[keyof typeof CONNECTOR_STATUS];

export type UserAuthInfo = { idToken: string };

export interface BaseConnectorSettings {
  clientId?: string;
  sessionTime?: number;
  chainConfig?: CustomChainConfig;
  web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE;
  useCoreKitKey?: boolean;
}

export interface IProvider extends SafeEventEmitter {
  get chainId(): string;
  request<S, R>(args: RequestArguments<S>): Promise<Maybe<R>>;
  sendAsync<T, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>): void;
  sendAsync<T, U>(req: JRPCRequest<T>): Promise<JRPCResponse<U>>;
  send<T, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>): void;
}

export interface IBaseProvider<T> extends IProvider {
  provider: SafeEventEmitterProvider | null;
  currentChainConfig: CustomChainConfig;
  setupProvider(provider: T): Promise<void>;
  addChain(chainConfig: CustomChainConfig): void;
  switchChain(params: { chainId: number }): Promise<void>;
  updateProviderEngineProxy(provider: SafeEventEmitterProvider): void;
}

export interface IConnector<T> extends SafeEventEmitter {
  connectorNamespace: ConnectorNamespaceType;
  currentChainNamespace: ChainNamespaceType;
  chainConfigProxy: CustomChainConfig | null;
  type: CONNECTOR_CATEGORY_TYPE;
  name: string;
  sessionTime: number;
  web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
  useCoreKitKey: boolean | undefined;
  clientId: string;
  status: CONNECTOR_STATUS_TYPE;
  provider: IProvider | null;
  connectorData?: unknown;
  connnected: boolean;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  init(options?: ConnectorInitOptions): Promise<void>;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
  connect(params?: T): Promise<IProvider | null>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  enableMFA(params?: T): Promise<void>;
  setConnectorSettings(connectorSettings: BaseConnectorSettings): void;
  switchChain(params: { chainId: number }): Promise<void>;
  authenticateUser(): Promise<UserAuthInfo>;
}

export type CONNECTED_EVENT_DATA = {
  connector: string;
  provider: IProvider;
  reconnected: boolean;
};

export interface BaseConnectorConfig {
  label: string;
  showOnModal?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

export type LoginMethodConfig = Record<
  string,
  {
    /**
     * Display Name. If not provided, we use the default for openlogin app
     */
    name: string;
    /**
     * Description for button. If provided, it renders as a full length button. else, icon button
     */
    description?: string;
    /**
     * Logo to be shown on mouse hover. If not provided, we use the default for openlogin app
     */
    logoHover?: string;
    /**
     * Logo to be shown on dark background (dark theme). If not provided, we use the default for openlogin app
     */
    logoLight?: string;
    /**
     * Logo to be shown on light background (light theme). If not provided, we use the default for openlogin app
     */
    logoDark?: string;
    /**
     * Show login button on the main list
     */
    mainOption?: boolean;
    /**
     * Whether to show the login button on modal or not
     */
    showOnModal?: boolean;
    /**
     * Whether to show the login button on desktop
     */
    showOnDesktop?: boolean;
    /**
     * Whether to show the login button on mobile
     */
    showOnMobile?: boolean;
  }
>;

export interface IWalletConnectExtensionConnector {
  name: string;
  chains: ChainNamespaceType[];
  logo: string;
  mobile: {
    native: string;
    universal: string;
  };
  desktop: {
    native: string;
    universal: string;
  };
}

export type WalletConnectData = {
  uri: string;
  extensionConnector: IWalletConnectExtensionConnector[];
};

export interface IConnectorDataEvent {
  connectorName: string;
  data: unknown;
}
