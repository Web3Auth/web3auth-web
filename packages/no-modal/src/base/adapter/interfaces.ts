import {
  AuthUserInfo,
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

import { AdapterNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { IWeb3AuthCoreOptions } from "../core/IWeb3Auth";
import { Web3AuthError } from "../errors";
import { ProviderEvents, SafeEventEmitterProvider } from "../provider/IProvider";
import { ADAPTER_CATEGORY, ADAPTER_EVENTS, ADAPTER_STATUS } from "./constants";

export type UserInfo = AuthUserInfo;

export { UX_MODE, UX_MODE_TYPE, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE };

export type ADAPTER_CATEGORY_TYPE = (typeof ADAPTER_CATEGORY)[keyof typeof ADAPTER_CATEGORY];

export interface AdapterInitOptions {
  /**
   * Whether to auto connect to the adapter based on redirect mode or saved adapters
   */
  autoConnect?: boolean;
}

export type ADAPTER_STATUS_TYPE = (typeof ADAPTER_STATUS)[keyof typeof ADAPTER_STATUS];

export type UserAuthInfo = { idToken: string };

export interface BaseAdapterSettings {
  getCoreOptions?: () => IWeb3AuthCoreOptions;
  getCurrentChainConfig?: () => CustomChainConfig;
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
  currentChainConfig: CustomChainConfig;
  setupProvider(provider: T): Promise<void>;
  addChain(chainConfig: CustomChainConfig): void;
  switchChain(params: { chainId: string }): Promise<void>;
  updateProviderEngineProxy(provider: SafeEventEmitterProvider): void;
  setKeyExportFlag(flag: boolean): void;
}

export interface IAdapter<T> extends SafeEventEmitter {
  adapterNamespace: AdapterNamespaceType;
  type: ADAPTER_CATEGORY_TYPE;
  name: string;
  status: ADAPTER_STATUS_TYPE;
  provider: IProvider | null;
  adapterData?: unknown;
  connnected: boolean;
  isInjected?: boolean;
  init(options?: AdapterInitOptions): Promise<void>;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
  connect(params?: T): Promise<IProvider | null>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  enableMFA(params?: T): Promise<void>;
  manageMFA(params?: T): Promise<void>;
  setAdapterSettings(adapterSettings: BaseAdapterSettings): void;
  switchChain(params: { chainId: string }): Promise<void>;
  authenticateUser(): Promise<UserAuthInfo>;
}

export type CONNECTED_EVENT_DATA = { adapter: string; provider: IProvider; reconnected: boolean };

export interface IAdapterDataEvent {
  adapterName: string;
  data: unknown;
}

export type AdapterEvents = {
  [ADAPTER_EVENTS.NOT_READY]: () => void;
  [ADAPTER_EVENTS.READY]: (adapter: string) => void;
  [ADAPTER_EVENTS.CONNECTED]: (data: CONNECTED_EVENT_DATA) => void;
  [ADAPTER_EVENTS.DISCONNECTED]: () => void;
  [ADAPTER_EVENTS.CONNECTING]: (data: { adapter: string }) => void;
  [ADAPTER_EVENTS.ERRORED]: (error: Web3AuthError) => void;
  [ADAPTER_EVENTS.ADAPTER_DATA_UPDATED]: (data: IAdapterDataEvent) => void;
  [ADAPTER_EVENTS.CACHE_CLEAR]: () => void;
};

export interface BaseAdapterConfig {
  label: string;
  isInjected?: boolean;
  showOnModal?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

export type LoginMethodConfig = Record<
  string,
  {
    /**
     * Display Name. If not provided, we use the default for auth app
     */
    name: string;
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
     * Whether to show the login button on desktop
     */
    showOnDesktop?: boolean;
    /**
     * Whether to show the login button on mobile
     */
    showOnMobile?: boolean;
  }
>;

export type WalletConnectV2Data = { uri: string };
