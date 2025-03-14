import { SafeEventEmitter } from "@web3auth/auth";

import { CHAIN_NAMESPACES, CONNECTOR_NAMESPACES, ConnectorNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { WalletInitializationError, WalletLoginError } from "../errors";
import { WALLET_CONNECTORS } from "../wallet";
import { CONNECTOR_EVENTS, CONNECTOR_STATUS } from "./constants";
import type {
  BaseConnectorSettings,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_STATUS_TYPE,
  ConnectorEvents,
  ConnectorInitOptions,
  IConnector,
  IProvider,
  UserAuthInfo,
  UserInfo,
} from "./interfaces";

export abstract class BaseConnector<T> extends SafeEventEmitter<ConnectorEvents> implements IConnector<T> {
  public connectorData?: unknown = {};

  isInjected?: boolean;

  public coreOptions: BaseConnectorSettings["coreOptions"];

  protected rehydrated = false;

  public abstract connectorNamespace: ConnectorNamespaceType;

  public abstract type: CONNECTOR_CATEGORY_TYPE;

  public abstract name: string;

  public abstract status: CONNECTOR_STATUS_TYPE;

  constructor(options: BaseConnectorSettings) {
    super();
    this.coreOptions = options.coreOptions;
  }

  get connnected(): boolean {
    return this.status === CONNECTOR_STATUS.CONNECTED;
  }

  public abstract get provider(): IProvider | null;

  checkConnectionRequirements(): void {
    // we reconnect without killing existing wallet connect session on calling connect again.
    if (this.name === WALLET_CONNECTORS.WALLET_CONNECT_V2 && this.status === CONNECTOR_STATUS.CONNECTING) return;

    if (this.status === CONNECTOR_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already connecting");
    if (this.status === CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.connectionError("Already connected");
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
    if (this.status === CONNECTOR_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === CONNECTOR_STATUS.READY) throw WalletInitializationError.notReady("Connector is already initialized");
  }

  checkDisconnectionRequirements(): void {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.disconnectionError("Not connected with wallet");
  }

  checkSwitchChainRequirements(params: { chainId: string }, init = false): void {
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (!this.coreOptions.chains) throw WalletInitializationError.invalidParams("chainConfigs is required");
    const newChainConfig = this.coreOptions.chains.find(
      (x) =>
        x.chainId === params.chainId && (x.chainNamespace === this.connectorNamespace || this.connectorNamespace === CONNECTOR_NAMESPACES.MULTICHAIN)
    );
    if (!newChainConfig) throw WalletInitializationError.invalidParams("Invalid chainId");
  }

  updateConnectorData(data: unknown): void {
    this.connectorData = data;
    this.emit(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, { connectorName: this.name, data });
  }

  abstract init(options?: ConnectorInitOptions): Promise<void>;
  abstract connect(params: T & { chainId: string }): Promise<IProvider | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
  abstract enableMFA(params?: T): Promise<void>;
  abstract manageMFA(params?: T): Promise<void>;
  abstract authenticateUser(): Promise<UserAuthInfo>;
  abstract switchChain(params: { chainId: string }): Promise<void>;
}
