import { getDeviceInfo, type SiwwTokens, verifySignedChallenge } from "@toruslabs/base-controllers";
import { AuthSessionManager } from "@toruslabs/session-manager";
import type { Wallet } from "@wallet-standard/base";
import { SafeEventEmitter } from "@web3auth/auth";

import { CHAIN_NAMESPACES, type ChainNamespaceType, CONNECTOR_NAMESPACES, ConnectorNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { WalletInitializationError, WalletLoginError } from "../errors";
import { citadelServerUrl } from "../utils";
import { WALLET_CONNECTOR_TYPE, WALLET_CONNECTORS } from "../wallet";
import { CAN_AUTHORIZE_STATUSES, CONNECTED_STATUSES } from "./connectorStatus";
import { CONNECTOR_EVENTS, CONNECTOR_STATUS } from "./constants";
import type {
  AuthTokenInfo,
  BaseConnectorLoginParams,
  BaseConnectorSettings,
  Connection,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_STATUS_TYPE,
  ConnectorEvents,
  ConnectorInitOptions,
  IConnector,
  IProvider,
  UserInfo,
} from "./interfaces";
import { checkIfTokenIsExpired } from "./utils";

export abstract class BaseConnector<T> extends SafeEventEmitter<ConnectorEvents> implements IConnector<T> {
  public connectorData?: unknown = {};

  public isInjected?: boolean;

  public icon?: string;

  public coreOptions: BaseConnectorSettings["coreOptions"];

  protected rehydrated = false;

  protected authSessionManager: AuthSessionManager | null = null;

  public abstract connectorNamespace: ConnectorNamespaceType;

  public abstract type: CONNECTOR_CATEGORY_TYPE;

  public abstract name: WALLET_CONNECTOR_TYPE | string;

  public abstract status: CONNECTOR_STATUS_TYPE;

  constructor(options: BaseConnectorSettings) {
    super();
    this.coreOptions = options.coreOptions;
  }

  get connected(): boolean {
    return CONNECTED_STATUSES.includes(this.status);
  }

  get canAuthorize(): boolean {
    return CAN_AUTHORIZE_STATUSES.includes(this.status);
  }

  get solanaWallet(): Wallet | null {
    return null;
  }

  get provider(): IProvider | null {
    return null;
  }

  checkConnectionRequirements(): void {
    // we reconnect without killing existing Wallet Connect or Metamask Connect session on calling connect again.
    if (this.name === WALLET_CONNECTORS.WALLET_CONNECT_V2 && this.status === CONNECTOR_STATUS.CONNECTING) return;
    if (this.name === WALLET_CONNECTORS.METAMASK && !this.isInjected && this.status === CONNECTOR_STATUS.CONNECTING) return;

    if (this.status === CONNECTOR_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already connecting");
    if (this.connected) throw WalletLoginError.connectionError("Already connected");
    if (this.status !== CONNECTOR_STATUS.READY)
      throw WalletLoginError.connectionError(
        "Wallet connector is not ready yet, Please wait for init function to resolve before calling connect/connectTo function"
      );
  }

  checkInitializationRequirements({ chainConfig }: { chainConfig?: CustomChainConfig }): void {
    if (!this.coreOptions.clientId) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid clientId in constructor");
    if (!chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!chainConfig.rpcTarget && chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    }
    if (!chainConfig.chainId && chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("chainID is required in chainConfig");
    }
    if (this.connectorNamespace !== CONNECTOR_NAMESPACES.MULTICHAIN && this.connectorNamespace !== chainConfig.chainNamespace)
      throw WalletInitializationError.invalidParams("Connector doesn't support this chain namespace");
    if (this.status === CONNECTOR_STATUS.NOT_READY) return;
    if (this.connected) throw WalletInitializationError.notReady("Already connected");
    if (this.status === CONNECTOR_STATUS.READY) throw WalletInitializationError.notReady("Connector is already initialized");
  }

  checkDisconnectionRequirements(): void {
    if (!this.connected) throw WalletLoginError.disconnectionError("Not connected with wallet");
  }

  checkSwitchChainRequirements(params: { chainId: string }, init = false): void {
    if (!init && !this.provider && !this.solanaWallet) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (!this.coreOptions.chains) throw WalletInitializationError.invalidParams("chainConfigs is required");
    const doesChainExist = this.coreOptions.chains.some(
      (x) =>
        x.chainId === params.chainId && (x.chainNamespace === this.connectorNamespace || this.connectorNamespace === CONNECTOR_NAMESPACES.MULTICHAIN)
    );
    if (!doesChainExist) throw WalletInitializationError.invalidParams("Invalid chainId");
  }

  updateConnectorData(data: unknown): void {
    this.connectorData = data;
    this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, { connectorName: this.name, data });
  }

  protected initSessionManager(address: string): void {
    this.authSessionManager = new AuthSessionManager({
      storageKeyPrefix: `w3a:siww:${this.name}:${address.toLowerCase()}`,
      apiClientConfig: { baseURL: citadelServerUrl(this.coreOptions.authBuildEnv) },
      storage: this.coreOptions.storage,
      cookieOptions: this.coreOptions.cookieOptions,
    });
  }

  protected async getCachedAuthTokenInfo(): Promise<AuthTokenInfo | null> {
    if (!this.authSessionManager) return null;

    const idToken = await this.authSessionManager.getIdToken();
    if (!idToken || checkIfTokenIsExpired(idToken)) return null;

    let [accessToken, refreshToken] = await Promise.all([this.authSessionManager.getAccessToken(), this.authSessionManager.getRefreshToken()]);

    if ((!accessToken || checkIfTokenIsExpired(accessToken)) && refreshToken) {
      try {
        const response = await this.authSessionManager.ensureRefresh();
        accessToken = response.access_token || (await this.authSessionManager.getAccessToken());
        refreshToken = response.refresh_token || refreshToken;
      } catch {
        // access token refresh failed; still return the valid idToken
      }
    }

    return { idToken, accessToken: accessToken ?? undefined, refreshToken: refreshToken ?? undefined };
  }

  protected async saveAuthTokenInfo(tokens: SiwwTokens): Promise<void> {
    if (!this.authSessionManager) return;
    await this.authSessionManager.setTokens({
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  protected async getCachedOrNullAuthTokenInfo(account: string): Promise<AuthTokenInfo | null> {
    this.initSessionManager(account);
    const cached = await this.getCachedAuthTokenInfo();
    if (cached) {
      this.status = CONNECTOR_STATUS.AUTHORIZED;
      this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, authTokenInfo: cached });
    }
    return cached;
  }

  protected async verifyAndAuthorize(params: {
    chainNamespace: ChainNamespaceType;
    signedMessage: string;
    challenge: string;
    authServer: string;
  }): Promise<AuthTokenInfo> {
    const tokens = await verifySignedChallenge({
      chainNamespace: params.chainNamespace,
      signedMessage: params.signedMessage,
      challenge: params.challenge,
      connector: this.name,
      authServer: params.authServer,
      web3AuthClientId: this.coreOptions.clientId,
      web3AuthNetwork: this.coreOptions.web3AuthNetwork,
      sessionTimeout: this.coreOptions.sessionTime,
      deviceInfo: getDeviceInfo(),
    });
    await this.saveAuthTokenInfo(tokens);
    const tokenInfo: AuthTokenInfo = { idToken: tokens.idToken, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    this.status = CONNECTOR_STATUS.AUTHORIZED;
    this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: this.name as WALLET_CONNECTOR_TYPE, authTokenInfo: tokenInfo });
    return tokenInfo;
  }

  protected async clearWalletSession(): Promise<void> {
    if (!this.authSessionManager) return;
    try {
      await this.authSessionManager.logout();
    } catch {
      await this.authSessionManager.clearSessionData();
    }
    this.authSessionManager = null;
  }

  abstract init(options?: ConnectorInitOptions): Promise<void>;
  abstract connect(params: T & BaseConnectorLoginParams): Promise<Connection | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
  abstract enableMFA(params?: T): Promise<void>;
  abstract manageMFA(params?: T): Promise<void>;
  abstract getAuthTokenInfo(): Promise<AuthTokenInfo>;
  abstract switchChain(params: { chainId: string }): Promise<void>;
}
