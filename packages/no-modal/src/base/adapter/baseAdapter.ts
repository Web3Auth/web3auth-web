import { SafeEventEmitter, WEB3AUTH_NETWORK, type WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";

import { getChainConfig } from "../chain/config";
import { AdapterNamespaceType, CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { WalletInitializationError, WalletLoginError, WalletOperationsError } from "../errors";
import { WALLET_ADAPTERS } from "../wallet";
import { ADAPTER_EVENTS, ADAPTER_STATUS } from "./constants";
import type {
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_STATUS_TYPE,
  AdapterEvents,
  AdapterInitOptions,
  BaseAdapterSettings,
  IAdapter,
  IProvider,
  UserAuthInfo,
  UserInfo,
} from "./interfaces";

export abstract class BaseAdapter<T> extends SafeEventEmitter<AdapterEvents> implements IAdapter<T> {
  public adapterData?: unknown = {};

  public sessionTime = 86400;

  public clientId: string;

  public web3AuthNetwork: WEB3AUTH_NETWORK_TYPE = WEB3AUTH_NETWORK.MAINNET;

  public useCoreKitKey: boolean = undefined;

  protected rehydrated = false;

  // should be added in constructor or from setAdapterSettings function
  // before calling init function.
  protected chainConfig: CustomChainConfig | null = null;

  protected knownChainConfigs: Record<CustomChainConfig["chainId"], CustomChainConfig> = {};

  public abstract adapterNamespace: AdapterNamespaceType;

  public abstract currentChainNamespace: ChainNamespaceType;

  public abstract type: ADAPTER_CATEGORY_TYPE;

  public abstract name: string;

  public abstract status: ADAPTER_STATUS_TYPE;

  constructor(options: BaseAdapterSettings = {}) {
    super();
    this.setAdapterSettings(options);
  }

  get chainConfigProxy(): CustomChainConfig | null {
    return this.chainConfig ? { ...this.chainConfig } : null;
  }

  get connnected(): boolean {
    return this.status === ADAPTER_STATUS.CONNECTED;
  }

  public abstract get provider(): IProvider | null;

  public setAdapterSettings(options: BaseAdapterSettings): void {
    if (this.status === ADAPTER_STATUS.READY) return;
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
      const defaultChainConfig = getChainConfig(customChainConfig.chainNamespace, customChainConfig.chainId, this.clientId);
      // NOTE: It is being forced casted to CustomChainConfig to handle OTHER Chainnamespace
      // where chainConfig is not required.
      const finalChainConfig = { ...(defaultChainConfig || {}), ...customChainConfig } as CustomChainConfig;

      this.chainConfig = finalChainConfig;
      this.addChainConfig(finalChainConfig);
    }
  }

  checkConnectionRequirements(): void {
    // we reconnect without killing existing wallet connect session on calling connect again.
    if (this.name === WALLET_ADAPTERS.WALLET_CONNECT_V2 && this.status === ADAPTER_STATUS.CONNECTING) return;
    if (this.status === ADAPTER_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already connecting");

    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletLoginError.connectionError("Already connected");
    if (this.status !== ADAPTER_STATUS.READY)
      throw WalletLoginError.connectionError(
        "Wallet adapter is not ready yet, Please wait for init function to resolve before calling connect/connectTo function"
      );
  }

  checkInitializationRequirements(): void {
    if (!this.clientId) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid clientId in constructor");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    if (!this.chainConfig.rpcTarget && this.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    }

    if (!this.chainConfig.chainId && this.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("chainID is required in chainConfig");
    }
    if (this.status === ADAPTER_STATUS.NOT_READY) return;
    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Adapter is already initialized");
  }

  checkDisconnectionRequirements(): void {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.disconnectionError("Not connected with wallet");
  }

  checkAddChainRequirements(chainConfig: CustomChainConfig, init = false): void {
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (this.currentChainNamespace !== chainConfig.chainNamespace) {
      throw WalletOperationsError.chainNamespaceNotAllowed("This adapter doesn't support this chainNamespace");
    }
  }

  checkSwitchChainRequirements({ chainId }: { chainId: string }, init = false): void {
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (!this.knownChainConfigs[chainId]) throw WalletLoginError.chainConfigNotAdded("Invalid chainId");
  }

  updateAdapterData(data: unknown): void {
    this.adapterData = data;
    this.emit(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, { adapterName: this.name, data });
  }

  protected addChainConfig(chainConfig: CustomChainConfig): void {
    const currentConfig = this.knownChainConfigs[chainConfig.chainId];
    this.knownChainConfigs[chainConfig.chainId] = {
      ...(currentConfig || {}),
      ...chainConfig,
    };
  }

  protected getChainConfig(chainId: string): CustomChainConfig | null {
    return this.knownChainConfigs[chainId] || null;
  }

  abstract init(options?: AdapterInitOptions): Promise<void>;
  abstract connect(params?: T): Promise<IProvider | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
  abstract enableMFA(params?: T): Promise<void>;
  abstract manageMFA(params?: T): Promise<void>;
  abstract authenticateUser(): Promise<UserAuthInfo>;
  abstract addChain(chainConfig: CustomChainConfig): Promise<void>;
  abstract switchChain(params: { chainId: string }): Promise<void>;
}
