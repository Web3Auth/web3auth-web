import { SafeEventEmitter, WhiteLabelData } from "@web3auth/auth";
import { WsEmbedParams } from "@web3auth/ws-embed";

import {
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS_TYPE,
  ConnectorEvents,
  ConnectorFn,
  IBaseProvider,
  IConnector,
  IProvider,
  UserAuthInfo,
  UserInfo,
  WEB3AUTH_NETWORK_TYPE,
} from "../adapter";
import { CustomChainConfig } from "../chain/IChainInterface";
import { type IPlugin } from "../plugin";
import { WALLET_CONNECTOR_TYPE } from "../wallet";

export type WalletServicesSettings = Omit<WsEmbedParams, "buildEnv" | "enableLogging" | "chainConfig" | "confirmationStrategy"> & {
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
   * multiple chain configurations
   * only chains provided will be used
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
   * Account abstraction provider for your chain namespace
   */
  accountAbstractionProvider?: IBaseProvider<IProvider>;

  /**
   * Whether to use AA with external wallet
   */
  useAAWithExternalWallet?: boolean;

  /**
   * Connectors to use
   */
  connectors?: ConnectorFn[];

  /**
   * Whether to enable multi injected provider discovery
   * @defaultValue true
   */
  multiInjectedProviderDiscovery?: boolean;

  /**
   * Wallet services settings
   */
  walletServicesSettings?: WalletServicesSettings;
}

export interface IWeb3AuthCore extends SafeEventEmitter {
  readonly coreOptions: IWeb3AuthCoreOptions;
  connectedConnectorName: string | null;
  status: CONNECTOR_STATUS_TYPE;
  provider: IProvider | null;
  getCurrentChain(): CustomChainConfig;
  init(): Promise<void>;
  logout(options?: { cleanup: boolean }): Promise<void>;
  getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null;
  getUserInfo(): Promise<Partial<UserInfo>>;
  authenticateUser(): Promise<UserAuthInfo>;
  switchChain(params: { chainId: string }): Promise<void>;
  addPlugin(plugin: IPlugin): void;
  getPlugin(pluginName: string): IPlugin | null;
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
