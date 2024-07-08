import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { CHAIN_NAMESPACES } from "../chain";
import { getChainConfig } from "../chain/config";
import { ChainNamespaceType, ConnectorNamespaceType, CustomChainConfig } from "../chain/interface";
import { WalletInitializationError, WalletLoginError, WalletOperationsError } from "../errors";
import { WALLET_CONNECTORS } from "../wallet";
import {
  BaseConnectorSettings,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  ConnectorInitOptions,
  IConnector,
  IProvider,
  UserAuthInfo,
  UserInfo,
  WEB3AUTH_NETWORK,
  WEB3AUTH_NETWORK_TYPE,
} from "./interface";

export abstract class BaseConnector<T> extends SafeEventEmitter implements IConnector<T> {
  public connectorData?: unknown = {};

  public sessionTime = 86400;

  public clientId: string;

  public web3AuthNetwork: WEB3AUTH_NETWORK_TYPE = WEB3AUTH_NETWORK.MAINNET;

  public useCoreKitKey: boolean = undefined;

  protected rehydrated = false;

  // should be added in constructor or from setConnectorSettings function
  // before calling init function.
  protected chainConfig: CustomChainConfig | null = null;

  protected knownChainConfigs: Record<CustomChainConfig["id"], CustomChainConfig> = {};

  public abstract connectorNamespace: ConnectorNamespaceType;

  public abstract currentChainNamespace: ChainNamespaceType;

  public abstract type: CONNECTOR_CATEGORY_TYPE;

  public abstract name: string;

  public abstract status: CONNECTOR_STATUS_TYPE;

  constructor(options: BaseConnectorSettings = {}) {
    super();
    this.setConnectorSettings(options);
  }

  get chainConfigProxy(): CustomChainConfig | null {
    return this.chainConfig ? { ...this.chainConfig } : null;
  }

  get connnected(): boolean {
    return this.status === CONNECTOR_STATUS.CONNECTED;
  }

  public abstract get provider(): IProvider | null;

  public setConnectorSettings(options: BaseConnectorSettings): void {
    if (this.status === CONNECTOR_STATUS.READY) return;
    if (options?.sessionTime) {
      this.sessionTime = options.sessionTime;
    }
    if (options?.clientId) {
      this.clientId = options.clientId;
    }
    if (options?.web3AuthNetwork) {
      this.web3AuthNetwork = options.web3AuthNetwork;
    }
    if (options?.useCoreKitKey !== undefined) {
      this.useCoreKitKey = options.useCoreKitKey;
    }
    const customChainConfig = options.chainConfig;
    if (customChainConfig) {
      if (!customChainConfig.chainNamespace) throw WalletInitializationError.notReady("ChainNamespace is required while setting chainConfig");
      this.currentChainNamespace = customChainConfig.chainNamespace;
      // chainId is optional in this function.
      // we go with mainnet chainId by default.
      const defaultChainConfig = getChainConfig(customChainConfig.chainNamespace, customChainConfig.id);
      // NOTE: It is being forced casted to CustomChainConfig to handle OTHER Chainnamespace
      // where chainConfig is not required.
      const finalChainConfig = { ...(defaultChainConfig || {}), ...customChainConfig } as CustomChainConfig;

      this.chainConfig = finalChainConfig;
      this.addChainConfig(finalChainConfig);
    }
  }

  checkConnectionRequirements(): void {
    // we reconnect without killing existing wallet connect session on calling connect again.
    if (this.name === WALLET_CONNECTORS.WALLET_CONNECT_V2 && this.status === CONNECTOR_STATUS.CONNECTING) return;
    else if (this.status === CONNECTOR_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already connecting");

    if (this.status === CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.connectionError("Already connected");
    if (this.status !== CONNECTOR_STATUS.READY)
      throw WalletLoginError.connectionError(
        "Wallet connector is not ready yet, Please wait for init function to resolve before calling connect/connectTo function"
      );
  }

  checkInitializationRequirements(): void {
    if (!this.clientId) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid clientId in constructor");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    if (!this.chainConfig.rpcUrls.default && this.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    }

    if (!this.chainConfig.id && this.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("chainID is required in chainConfig");
    }
    if (this.status === CONNECTOR_STATUS.NOT_READY) return;
    if (this.status === CONNECTOR_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === CONNECTOR_STATUS.READY) throw WalletInitializationError.notReady("Connector is already initialized");
  }

  checkDisconnectionRequirements(): void {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.disconnectionError("Not connected with wallet");
  }

  checkAddChainRequirements(chainConfig: CustomChainConfig, init = false): void {
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (this.currentChainNamespace !== chainConfig.chainNamespace) {
      throw WalletOperationsError.chainNamespaceNotAllowed("This connector doesn't support this chainNamespace");
    }
  }

  checkSwitchChainRequirements({ chainId }: { chainId: number }, init = false): void {
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (!this.knownChainConfigs[chainId]) throw WalletLoginError.chainConfigNotAdded("Invalid chainId");
  }

  updateConnectorData(data: unknown): void {
    this.connectorData = data;
    this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, { connectorName: this.name, data });
  }

  protected addChainConfig(chainConfig: CustomChainConfig): void {
    const currentConfig = this.knownChainConfigs[chainConfig.id];
    this.knownChainConfigs[chainConfig.id] = {
      ...(currentConfig || {}),
      ...chainConfig,
    };
  }

  protected getChainConfig(chainId: number): CustomChainConfig | null {
    return this.knownChainConfigs[chainId] || null;
  }

  abstract init(options?: ConnectorInitOptions): Promise<void>;
  abstract connect(params?: T): Promise<IProvider | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
  abstract enableMFA(params?: T): Promise<void>;
  abstract authenticateUser(): Promise<UserAuthInfo>;
  abstract addChain(chainConfig: CustomChainConfig): Promise<void>;
  abstract switchChain(params: { chainId: number }): Promise<void>;
}
