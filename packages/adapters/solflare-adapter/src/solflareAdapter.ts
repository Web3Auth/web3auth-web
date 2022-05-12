import type { Cluster } from "@solana/web3.js";
import SolflareClass from "@solflare-wallet/sdk";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  getChainConfig,
  log,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { SolflareInjectedProvider } from "@web3auth/solana-provider";
export interface SolflareWalletOptions {
  chainConfig?: CustomChainConfig;
}

export class SolflareAdapter extends BaseAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.SOLFLARE;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public _wallet: SolflareClass | null = null;

  private solflareProvider: SolflareInjectedProvider | null = null;

  private rehydrated = false;

  constructor(options: SolflareWalletOptions = {}) {
    super();
    this.chainConfig = options.chainConfig || null;
  }

  get isWalletConnected(): boolean {
    return !!(this._wallet?.isConnected && this.status === ADAPTER_STATUS.CONNECTED);
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.solflareProvider?.provider || null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  setAdapterSettings(_: unknown): void {}

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    // set chainConfig for mainnet by default if not set
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
    }
    this.solflareProvider = new SolflareInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.SOLFLARE);

    try {
      log.debug("initializing solflare adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached solflare provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    try {
      super.checkConnectionRequirements();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.SOLFLARE });
      let cluster: Cluster = "mainnet-beta";
      if (this.chainConfig?.chainId === "0x1") {
        cluster = "mainnet-beta";
      } else if (this.chainConfig?.chainId === "0x2") {
        cluster = "devnet";
      } else if (this.chainConfig?.chainId === "0x3") {
        cluster = "testnet";
      } else {
        throw WalletLoginError.connectionError("Invalid chainId, solflare doesn't support custom solana networks");
      }
      const wallet = new SolflareClass({ network: cluster });
      if (!wallet.isConnected) {
        try {
          await wallet.connect();
        } catch (error: unknown) {
          if (error instanceof Web3AuthError) throw error;
          throw WalletLoginError.connectionError((error as Error)?.message);
        }
      }
      await this.connectWithProvider(wallet);

      this._wallet = wallet;

      if (!wallet.publicKey) throw WalletLoginError.connectionError();
      wallet.on("disconnect", this._onDisconnect);

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
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    try {
      await this._wallet?.disconnect();
      if (options.cleanup) {
        this.status = ADAPTER_STATUS.NOT_READY;
        this.solflareProvider = null;
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

  private async connectWithProvider(injectedProvider: SolflareClass): Promise<SafeEventEmitterProvider | null> {
    if (!this.solflareProvider) throw WalletLoginError.connectionError("No solflare provider");
    await this.solflareProvider.setupProvider(injectedProvider);
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.SOLFLARE, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
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
