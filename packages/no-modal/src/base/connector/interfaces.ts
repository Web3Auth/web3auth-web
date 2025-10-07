import {
  AUTH_CONNECTION_TYPE,
  AuthUserInfo,
  ExtraLoginOptions,
  JRPCRequest,
  JRPCResponse,
  Maybe,
  RequestArguments,
  SafeEventEmitter,
  SendCallBack,
  UX_MODE,
  type UX_MODE_TYPE,
  WEB3AUTH_NETWORK,
  type WEB3AUTH_NETWORK_TYPE,
} from "@web3auth/auth";

import { type Analytics } from "../analytics";
import type { ChainNamespaceType, ConnectorNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import type { IWeb3AuthCoreOptions } from "../core/IWeb3Auth";
import { Web3AuthError } from "../errors";
import type { ProjectConfig } from "../interfaces";
import type { ProviderEvents, SafeEventEmitterProvider } from "../provider/IProvider";
import { WALLET_CONNECTOR_TYPE } from "../wallet";
import { CONNECTOR_CATEGORY, CONNECTOR_EVENTS, CONNECTOR_STATUS } from "./constants";

export type UserInfo = AuthUserInfo;

export { UX_MODE, UX_MODE_TYPE, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE };

export type CONNECTOR_CATEGORY_TYPE = (typeof CONNECTOR_CATEGORY)[keyof typeof CONNECTOR_CATEGORY];

export interface ConnectorInitOptions {
  /**
   * Whether to auto connect to the connector based on redirect mode or saved connectors
   */
  autoConnect?: boolean;
  /**
   * The chainId to connect to
   */
  chainId: string;
}

export type CONNECTOR_STATUS_TYPE = (typeof CONNECTOR_STATUS)[keyof typeof CONNECTOR_STATUS];

export type IdentityTokenInfo = { idToken: string };

export interface BaseConnectorSettings {
  coreOptions: IWeb3AuthCoreOptions;
  analytics?: Analytics;
}

export interface IProvider extends SafeEventEmitter<ProviderEvents> {
  get chainId(): string;
  request<S, R>(args: RequestArguments<S>): Promise<Maybe<R>>;
  sendAsync<T, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>): void;
  sendAsync<T, U>(req: JRPCRequest<T>): Promise<JRPCResponse<U>>;
  send<T, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>): void;
}

export interface IBaseProvider<T> extends IProvider {
  provider: SafeEventEmitterProvider | null;
  currentChain: CustomChainConfig;
  setupProvider(provider: T, chainId: string): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
  updateProviderEngineProxy(provider: SafeEventEmitterProvider): void;
  setKeyExportFlag(flag: boolean): void;
}

export interface IConnector<T> extends SafeEventEmitter {
  connectorNamespace: ConnectorNamespaceType;
  type: CONNECTOR_CATEGORY_TYPE;
  name: WALLET_CONNECTOR_TYPE | string;
  status: CONNECTOR_STATUS_TYPE;
  provider: IProvider | null;
  connectorData?: unknown;
  connnected: boolean;
  isInjected?: boolean;
  icon?: string;
  init(options?: ConnectorInitOptions): Promise<void>;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
  connect(params: T & { chainId: string }): Promise<IProvider | null>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  enableMFA(params?: T): Promise<void>;
  manageMFA(params?: T): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
  getIdentityToken(): Promise<IdentityTokenInfo>;
  cleanup?(): Promise<void>;
}

export type ConnectorParams = {
  projectConfig?: ProjectConfig;
  coreOptions: IWeb3AuthCoreOptions;
  analytics: Analytics;
};

export type BaseConnectorLoginParams = {
  chainId: string;
  getIdentityToken: boolean;
};

export type ConnectorFn = (params: ConnectorParams) => IConnector<unknown>;

export type CONNECTED_EVENT_DATA = {
  connector: WALLET_CONNECTOR_TYPE;
  provider: IProvider;
  reconnected: boolean;
  identityTokenInfo: IdentityTokenInfo;
};

export interface IConnectorDataEvent {
  connectorName: string;
  data: unknown;
}

export type ConnectorEvents = {
  [CONNECTOR_EVENTS.NOT_READY]: () => void;
  [CONNECTOR_EVENTS.READY]: (connector: string) => void;
  [CONNECTOR_EVENTS.CONNECTED]: (data: CONNECTED_EVENT_DATA) => void;
  [CONNECTOR_EVENTS.DISCONNECTED]: () => void;
  [CONNECTOR_EVENTS.CONNECTING]: (data: { connector: string }) => void;
  [CONNECTOR_EVENTS.ERRORED]: (error: Web3AuthError) => void;
  [CONNECTOR_EVENTS.REHYDRATION_ERROR]: (error: Web3AuthError) => void;
  [CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED]: (data: IConnectorDataEvent) => void;
  [CONNECTOR_EVENTS.CACHE_CLEAR]: () => void;
  [CONNECTOR_EVENTS.CONNECTORS_UPDATED]: (data: { connectors: IConnector<unknown>[] }) => void;
  [CONNECTOR_EVENTS.MFA_ENABLED]: (isMFAEnabled: boolean) => void;
};

export interface BaseConnectorConfig {
  label: string;
  icon?: string;
  isInjected?: boolean;
  chainNamespaces?: ChainNamespaceType[];
  showOnModal?: boolean;
}

export type LoginMethodConfig = Partial<
  Record<
    AUTH_CONNECTION_TYPE,
    {
      /**
       * Display Name. If not provided, we use the default for auth app
       */
      name?: string;
      /**
       * Description for button. If provided, it renders as a full length button. else, icon button
       */
      description?: string;
      /**
       * Logo to be shown on mouse hover. If not provided, we use the default for auth app
       */
      logoHover?: string;
      /**
       * Logo to be shown on dark background (dark theme). If not provided, we use the default for auth app
       */
      logoLight?: string;
      /**
       * Logo to be shown on light background (light theme). If not provided, we use the default for auth app
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
       * Auth connection id of the provider.
       */
      authConnectionId?: string;
      /**
       * Grouped auth connection id of the provider.
       */
      groupedAuthConnectionId?: string;
      /**
       * ExtraLoginOption params to be used for social login.
       */
      extraLoginOptions?: ExtraLoginOptions;
      /**
       * Auth connection type of the auth connector.
       * Can be different from the original key.
       *
       * Example: This helps in customizing the google login button with auth0 custom connector.
       */
      authConnection?: AUTH_CONNECTION_TYPE;
      /**
       * Whether is it default connector.
       *
       * @internal
       */
      isDefault?: boolean;
    }
  >
>;

export type WalletConnectV2Data = { uri: string };

export type MetaMaskConnectorData = { uri: string };
