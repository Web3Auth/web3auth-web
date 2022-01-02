import { LoginConfig, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { AdapterNamespaceType, ChainNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { SafeEventEmitterProvider } from "../provider/IProvider";

export const BASE_ADAPTER_EVENTS = {
  READY: "ready",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  ERRORED: "errored",
};

export type UserInfo = {
  /**
   * Email of the logged in user
   */
  email: string;
  /**
   * Full name of the logged in user
   */
  name: string;
  /**
   * Profile image of the logged in user
   */
  profileImage: string;
  /**
   * verifier of the logged in user (google, facebook etc)
   */
  verifier: string;
  /**
   * Verifier Id of the logged in user
   *
   * email for google,
   * id for facebook,
   * username for reddit,
   * id for twitch,
   * id for discord
   */
  verifierId: string;
};

export const ADAPTER_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app",
} as const;
export type ADAPTER_CATEGORY_TYPE = typeof ADAPTER_CATEGORY[keyof typeof ADAPTER_CATEGORY];

export interface AdapterInitOptions {
  /**
   * Whether to auto connect to the adapter based on redirect mode or saved adapters
   */
  autoConnect?: boolean;
}

export interface IAdapter<T> extends SafeEventEmitter {
  namespace: AdapterNamespaceType;
  currentChainNamespace: ChainNamespaceType;
  type: ADAPTER_CATEGORY_TYPE;
  ready: boolean;
  connecting: boolean;
  connected: boolean;
  provider: SafeEventEmitterProvider;
  adapterData?: unknown;
  init(options?: AdapterInitOptions): Promise<void>;
  connect(params?: T): Promise<SafeEventEmitterProvider | void>;
  disconnect(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo> | null>;
  setChainConfig(customChainConfig: CustomChainConfig): void;
  setAdapterSettings(adapterSettings: unknown): void;
}

export abstract class BaseAdapter<T> extends SafeEventEmitter implements IAdapter<T> {
  public adapterData?: unknown = {};

  public abstract namespace: AdapterNamespaceType;

  public abstract currentChainNamespace: ChainNamespaceType;

  public abstract type: ADAPTER_CATEGORY_TYPE;

  public abstract connecting: boolean;

  public abstract ready: boolean;

  public abstract connected: boolean;

  public abstract provider: SafeEventEmitterProvider;

  abstract init(options?: AdapterInitOptions): Promise<void>;
  abstract connect(params?: T): Promise<SafeEventEmitterProvider | void>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo> | null>;
  abstract setChainConfig(customChainConfig: CustomChainConfig): void;
  abstract setAdapterSettings(adapterSettings: unknown): void;
}

export interface BaseAdapterConfig {
  label: string;
  showOnModal?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

export interface Adapter<T> {
  name: string;
  adapter: () => IAdapter<T>;
}

export type LoginMethodConfig = LoginConfig;

export interface WalletConnectV1Data {
  uri: string;
}
