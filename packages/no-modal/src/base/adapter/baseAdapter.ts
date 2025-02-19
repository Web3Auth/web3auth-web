import { SafeEventEmitter } from "@web3auth/auth";

import { AdapterNamespaceType, CHAIN_NAMESPACES, CustomChainConfig } from "../chain/IChainInterface";
import { WalletInitializationError, WalletLoginError } from "../errors";
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

  isInjected?: boolean;

  public coreOptions: BaseAdapterSettings["coreOptions"];

  protected rehydrated = false;

  public abstract adapterNamespace: AdapterNamespaceType;

  public abstract type: ADAPTER_CATEGORY_TYPE;

  public abstract name: string;

  public abstract status: ADAPTER_STATUS_TYPE;

  constructor(options: BaseAdapterSettings) {
    super();
    this.coreOptions = options.coreOptions;
  }

  get connnected(): boolean {
    return this.status === ADAPTER_STATUS.CONNECTED;
  }

  public abstract get provider(): IProvider | null;

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

  checkInitializationRequirements({ chainConfig }: { chainConfig?: CustomChainConfig }): void {
    if (!this.coreOptions.clientId) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid clientId in constructor");
    if (!chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!chainConfig.rpcTarget && chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    }

    if (!chainConfig.chainId && chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("chainID is required in chainConfig");
    }
    if (this.status === ADAPTER_STATUS.NOT_READY) return;
    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Adapter is already initialized");
  }

  checkDisconnectionRequirements(): void {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.disconnectionError("Not connected with wallet");
  }

  checkSwitchChainRequirements(_params: { chainId: string }, init = false): void {
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
  }

  updateAdapterData(data: unknown): void {
    this.adapterData = data;
    this.emit(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, { adapterName: this.name, data });
  }

  abstract init(options?: AdapterInitOptions): Promise<void>;
  abstract connect(params?: T & { chainId: string }): Promise<IProvider | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
  abstract enableMFA(params?: T): Promise<void>;
  abstract manageMFA(params?: T): Promise<void>;
  abstract authenticateUser(): Promise<UserAuthInfo>;
  abstract switchChain(params: { chainId: string }): Promise<void>;
}
