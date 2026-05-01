import { type AccountAbstractionMultiChainConfig } from "@toruslabs/ethereum-controllers";
import {
  type BUILD_ENV_TYPE,
  type CookieOptions,
  MfaLevelType,
  MfaSettings,
  type StorageConfig,
  UX_MODE_TYPE,
  type WEB3AUTH_NETWORK_TYPE,
  type WhiteLabelData,
} from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type Analytics } from "../analytics";
import type { CustomChainConfig } from "../chain/IChainInterface";
import { CONNECTOR_INITIAL_AUTHENTICATION_MODE } from "../connector/constants";
import type { IBaseProvider, IConnector } from "../connector/interfaces";
import type { ProjectConfig } from "../interfaces";
import type { PluginFn } from "../plugin/IPlugin";

export interface UIConfig extends WhiteLabelData {
  /**
   * UX Mode for the auth connector
   */
  uxMode?: UX_MODE_TYPE;
}

export type WalletServicesConfig = Omit<
  WsEmbedParams,
  "buildEnv" | "enableLogging" | "chainId" | "chains" | "confirmationStrategy" | "accountAbstractionConfig"
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

export type ConnectorInitialAuthenticationModeType =
  (typeof CONNECTOR_INITIAL_AUTHENTICATION_MODE)[keyof typeof CONNECTOR_INITIAL_AUTHENTICATION_MODE];

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
   * default chain Id to use
   */
  defaultChainId?: string;

  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;

  /**
   * Custom storage adapters for auth tokens (sessionId, accessToken, refreshToken, idToken).
   * @defaultValue localStorage-based adapters
   */
  storage?: StorageConfig;

  /**
   * Cookie configuration used when storage adapters are cookie-based.
   */
  cookieOptions?: CookieOptions;

  /**
   * sessionTime (in seconds) for idToken issued by Web3Auth for server side verification.
   * @defaultValue 7 * 86400
   *
   * Note: max value can be 30 days (86400 * 30) and min can be  1 sec (1)
   */
  sessionTime?: number;

  /**
   * Web3Auth Network to use for the session.
   */
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;

  /**
   * Uses core-kit key with web3auth provider
   * @defaultValue false
   */
  useSFAKey?: boolean;

  /**
   * WhiteLabel options for web3auth
   */
  uiConfig?: UIConfig;

  /**
   * Account abstraction config for your chain namespace
   */
  accountAbstractionConfig?: AccountAbstractionMultiChainConfig;

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

  /**
   * Private key provider for xrpl cases
   */
  privateKeyProvider?: IBaseProvider<string>;

  /**
   * Whether to enable SSR mode
   *
   * @defaultValue false
   */
  ssr?: boolean;

  /**
   * Build environment for Auth connector
   * @internal
   * @defaultValue BUILD_ENV.PRODUCTION
   */
  authBuildEnv?: BUILD_ENV_TYPE;

  /**
   * MFA settings for the auth connector
   */
  mfaSettings?: MfaSettings;

  /**
   * MFA level for the auth connector
   */
  mfaLevel?: MfaLevelType;

  /**
   * Initial authentication mode for the auth connector.
   * @defaultValue "connect-and-sign"
   */
  initialAuthenticationMode?: ConnectorInitialAuthenticationModeType;
}

export interface BaseConnectorSettings {
  coreOptions: IWeb3AuthCoreOptions;
  analytics?: Analytics;
}

export type ConnectorParams = {
  projectConfig?: ProjectConfig;
  coreOptions: IWeb3AuthCoreOptions;
  analytics: Analytics;
};

export type ConnectorFn = (params: ConnectorParams) => IConnector<unknown>;

export type Web3AuthNoModalOptions = IWeb3AuthCoreOptions;
