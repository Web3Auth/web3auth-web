import { type LoginParams, SafeEventEmitter } from "@web3auth/auth";

import { type ChainNamespaceType, type CustomChainConfig } from "../chain/IChainInterface";
import { CONNECTOR_EVENTS, type CONNECTOR_STATUS_TYPE } from "../connector/constants";
import type { AuthTokenInfo, CONNECTED_EVENT_DATA, Connection, ConnectorEvents, IConnector, UserInfo } from "../connector/interfaces";
import { Web3AuthError } from "../errors";
import { LoginModeType } from "../interfaces";
import type { IPlugin } from "../plugin/IPlugin";
import { type WALLET_CONNECTOR_TYPE, WALLET_CONNECTORS } from "../wallet";
import type { IWeb3AuthCoreOptions } from "./IWeb3AuthOptions";

export * from "./IWeb3AuthOptions";

export type AuthLoginParams = LoginParams & {
  // to maintain backward compatibility
  loginHint?: string;

  idToken?: string;
};

export type LoginParamMap = {
  [WALLET_CONNECTORS.AUTH]: Partial<AuthLoginParams>;
  [WALLET_CONNECTORS.METAMASK]: { chainNamespace: ChainNamespaceType };
  [WALLET_CONNECTORS.COINBASE]: { chainNamespace: ChainNamespaceType };
  [WALLET_CONNECTORS.WALLET_CONNECT_V2]: { chainNamespace: ChainNamespaceType };
};

export interface IWeb3AuthCore extends SafeEventEmitter {
  currentChainId: string | null;
  readonly coreOptions: IWeb3AuthCoreOptions;
  connectedConnectorName: WALLET_CONNECTOR_TYPE | null;
  currentChain: CustomChainConfig | undefined;
  status: CONNECTOR_STATUS_TYPE;
  connection: Connection | null;
  init(options?: { signal?: AbortSignal }): Promise<void>;
  getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null;
  getPlugin(pluginName: string): IPlugin | null;
  logout(options?: { cleanup: boolean }): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  getAuthTokenInfo(): Promise<Pick<AuthTokenInfo, "idToken">>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface IWeb3Auth extends IWeb3AuthCore {
  loginMode: LoginModeType;
  connected: boolean;
  cachedConnector: string | null;
  getConnector(connectorName: WALLET_CONNECTOR_TYPE): IConnector<unknown> | null;
  /**
   * Connect to a specific wallet connector
   * @param walletName - Key of the wallet connector to use.
   */
  connectTo<T extends WALLET_CONNECTOR_TYPE>(walletName: T, loginParams?: LoginParamMap[T]): Promise<Connection | null>;
  enableMFA<T>(params: T): Promise<void>;
  manageMFA<T>(params: T): Promise<void>;
  setAnalyticsProperties(properties: Record<string, unknown>): void;
  cleanup(): Promise<void>;
}

export type SDK_CONNECTED_EVENT_DATA = CONNECTED_EVENT_DATA & { loginMode: LoginModeType; pendingUserConsent?: boolean };
export type SDK_CONSENT_ACCEPTED_EVENT_DATA = { reconnected: boolean };

export type Web3AuthNoModalEvents = Omit<ConnectorEvents, "connected" | "errored" | "ready" | "consent_requiring" | "consent_accepted"> & {
  [CONNECTOR_EVENTS.READY]: () => void;
  [CONNECTOR_EVENTS.CONNECTED]: (data: SDK_CONNECTED_EVENT_DATA) => void;
  [CONNECTOR_EVENTS.CONSENT_REQUIRING]: () => void;
  [CONNECTOR_EVENTS.CONSENT_ACCEPTED]: (data: SDK_CONSENT_ACCEPTED_EVENT_DATA) => void;
  [CONNECTOR_EVENTS.ERRORED]: (error: Web3AuthError, loginMode: LoginModeType) => void;
  MODAL_VISIBILITY: (visibility: boolean) => void;
};
