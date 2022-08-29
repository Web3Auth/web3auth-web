import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  getChainConfig,
  log,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseSolanaAdapter } from "@web3auth/base-solana-adapter";
import { ISlopeProvider, SlopeInjectedProxyProvider } from "@web3auth/solana-provider";

import { detectProvider } from "./utils";

export interface SlopeWalletOptions {
  chainConfig?: CustomChainConfig;
  sessionTime?: number;
  clientId?: string;
}

export class SlopeAdapter extends BaseSolanaAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.SLOPE;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public _wallet: ISlopeProvider | null = null;

  private slopeProxyProvider: SlopeInjectedProxyProvider | null = null;

  private rehydrated = false;

  constructor(options: SlopeWalletOptions) {
    super(options);
    this.chainConfig = options?.chainConfig || null;
    this.sessionTime = options?.sessionTime || 86400;
  }

  get isWalletConnected(): boolean {
    return this.status === ADAPTER_STATUS.CONNECTED;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.slopeProxyProvider?.provider || null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  setAdapterSettings(options: { sessionTime?: number; clientId?: string }): void {
    if (this.status === ADAPTER_STATUS.READY) return;
    if (options?.sessionTime) {
      this.sessionTime = options.sessionTime;
    }
    if (options?.clientId) {
      this.clientId = options.clientId;
    }
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    // set chainConfig for mainnet by default if not set
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
    }
    this._wallet = await detectProvider({ interval: 500, count: 3 });
    if (!this._wallet) throw WalletInitializationError.notInstalled();
    this.slopeProxyProvider = new SlopeInjectedProxyProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.SLOPE);

    try {
      log.debug("initializing slope adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached slope provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    try {
      super.checkConnectionRequirements();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.SLOPE });

      if (!this._wallet) throw WalletInitializationError.notInstalled();
      try {
        const { data, msg } = await this._wallet.connect();
        if (!data.publicKey) throw WalletLoginError.connectionError(`No public key found: ${msg}`);
        await this.connectWithProvider(this._wallet);
      } catch (error: unknown) {
        if (error instanceof Web3AuthError) throw error;
        throw WalletLoginError.connectionError((error as Error)?.message);
      }

      return this.provider;
    } catch (error: unknown) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      throw error;
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnect();
    try {
      await this._wallet?.disconnect();
      if (options.cleanup) {
        this.status = ADAPTER_STATUS.NOT_READY;
        this.slopeProxyProvider = null;
        this._wallet = null;
      }
      this.emit(ADAPTER_EVENTS.DISCONNECTED);
    } catch (error: unknown) {
      this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private async connectWithProvider(injectedProvider: ISlopeProvider): Promise<SafeEventEmitterProvider | null> {
    if (!this.slopeProxyProvider) throw WalletLoginError.connectionError("No Slope provider found");
    await this.slopeProxyProvider.setupProvider(injectedProvider);
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.SLOPE, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
    return this.provider;
  }

  private _onDisconnect = () => {
    if (this._wallet) {
      this._wallet.off("disconnect", this._onDisconnect);
      this.rehydrated = false;
      // ready to be connected again only if it was previously connected and not cleaned up
      this.status = this.status === ADAPTER_STATUS.CONNECTED ? ADAPTER_STATUS.READY : ADAPTER_STATUS.NOT_READY;
      this.emit(ADAPTER_EVENTS.DISCONNECTED);
    }
  };
}
