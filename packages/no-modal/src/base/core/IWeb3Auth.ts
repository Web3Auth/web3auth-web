import { type AccountAbstractionConfig } from "@toruslabs/ethereum-controllers";
import { SafeEventEmitter, type WhiteLabelData } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type CustomChainConfig } from "../chain/IChainInterface";
import {
  CONNECTOR_EVENTS,
  type CONNECTOR_STATUS_TYPE,
  ConnectorEvents,
  type ConnectorFn,
  type IConnector,
  type IProvider,
  type UserAuthInfo,
  type UserInfo,
  type WEB3AUTH_NETWORK_TYPE,
} from "../connector";
import { type IPlugin, PluginFn } from "../plugin";
import { type WALLET_CONNECTOR_TYPE } from "../wallet";

export type WalletServicesConfig = Omit<
  WsEmbedParams,
  "buildEnv" | "enableLogging" | "chainConfig" | "confirmationStrategy" | "accountAbstractionConfig"
> & {
  /**
   * Determines how to show confirmation screens
   * @defaultValue default
   *
   * default & auto-approve
   * - use auto-approve as default
   * - if wallet connect request use modal
   *
   * modal
   * - use modal always
   */
  confirmationStrategy?: Exclude<WsEmbedParams["confirmationStrategy"], "popup">;
  modalZIndex?: number;
};

export interface IWeb3AuthCoreOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;

  /**
   * multiple chain configurations,
   * only provided chains will be used
   */
  chains?: CustomChainConfig[];
  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;
  /**
   * setting to "local" will persist social login session across browser tabs.
   *
   * @defaultValue "local"
   */
  storageKey?: "session" | "local";

  /**
   * sessionTime (in seconds) for idToken issued by Web3Auth for server side verification.
   * @defaultValue 86400
   *
   * Note: max value can be 7 days (86400 * 7) and min can be  1 day (86400)
   */
  sessionTime?: number;
  /**
   * Web3Auth Network to use for the session & the issued idToken
   * @defaultValue mainnet
   */
  web3AuthNetwork?: WEB3AUTH_NETWORK_TYPE;

  /**
   * Uses core-kit key with web3auth provider
   * @defaultValue false
   */
  useCoreKitKey?: boolean;

  /**
   * WhiteLabel options for web3auth
   */
  uiConfig?: WhiteLabelData;

  /**
   * Account abstraction config for your chain namespace
   */
  accountAbstractionConfig?: AccountAbstractionConfig;

  /**
   * Whether to use AA with external wallet
   */
  useAAWithExternalWallet?: boolean;

  /**
   * Connectors to use
   */
  connectors?: ConnectorFn[];

  /**
   * Plugins to use
   */
  plugins?: PluginFn[];

  /**
   * Whether to enable multi injected provider discovery
   * @defaultValue true
   */
  multiInjectedProviderDiscovery?: boolean;

  /**
   * Wallet services config
   */
  walletServicesConfig?: WalletServicesConfig;
}

export interface IWeb3AuthCore extends SafeEventEmitter {
  readonly coreOptions: IWeb3AuthCoreOptions;
  connectedConnectorName: string | null;
  currentChain: CustomChainConfig;
  status: CONNECTOR_STATUS_TYPE;
  provider: IProvider | null;
  init(): Promise<void>;
  getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null;
  getPlugin(pluginName: string): IPlugin | null;
  logout(options?: { cleanup: boolean }): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  authenticateUser(): Promise<UserAuthInfo>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface IWeb3Auth extends IWeb3AuthCore {
  connected: boolean;
  cachedConnector: string | null;
  getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null;
  /**
   * Connect to a specific wallet connector
   * @param walletName - Key of the wallet connector to use.
   */
  connectTo<T>(walletName: WALLET_CONNECTOR_TYPE, loginParams?: T): Promise<IProvider | null>;
  enableMFA<T>(params: T): Promise<void>;
  manageMFA<T>(params: T): Promise<void>;
}

export type Web3AuthNoModalEvents = ConnectorEvents & { [CONNECTOR_EVENTS.READY]: () => void; MODAL_VISIBILITY: (visibility: boolean) => void };

export type Web3AuthNoModalOptions = IWeb3AuthCoreOptions;
