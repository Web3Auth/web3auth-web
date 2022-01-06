import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  getChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import type { PhantomInjectedProvider, PhantomWallet } from "@web3auth/solana-provider";
import log from "loglevel";

import { poll } from "./utils";
export interface PhantomAdapterOptions {
  chainConfig?: CustomChainConfig;
}
export class PhantomAdapter extends BaseAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.PHANTOM;

  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider!: SafeEventEmitterProvider | undefined;

  public _wallet!: PhantomWallet | undefined;

  private phantomProvider!: PhantomInjectedProvider;

  constructor(options: PhantomAdapterOptions = {}) {
    super();
    this.chainConfig = options.chainConfig;
  }

  get isPhantomAvailable(): boolean {
    return typeof window !== "undefined" && !!(window as any).solana?.isPhantom;
  }

  get isWalletConnected(): boolean {
    return !!(this._wallet && this._wallet.isConnected && this.status === ADAPTER_STATUS.CONNECTED);
  }

  setAdapterSettings(_: unknown): void {}

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    // set chainConfig for mainnet by default if not set
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
    }
    const isAvailable = this.isPhantomAvailable || (await poll(() => this.isPhantomAvailable, 1000, 3));
    if (!isAvailable) throw WalletInitializationError.notInstalled();
    this._wallet = typeof window !== "undefined" && (window as any).solana;

    const { PhantomInjectedProvider } = await import("@web3auth/solana-provider");
    this.phantomProvider = new PhantomInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_STATUS.READY, WALLET_ADAPTERS.PHANTOM);

    try {
      if (options.autoConnect) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached phantom provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connectWithProvider(injectedProvider: PhantomWallet): Promise<SafeEventEmitterProvider | null> {
    this.provider = await this.phantomProvider.setupProvider(injectedProvider);
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_STATUS.CONNECTED, WALLET_ADAPTERS.PHANTOM);
    return this.provider;
  }

  async connect(): Promise<void> {
    try {
      super.checkConnectionRequirements();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_STATUS.CONNECTING, { adapter: WALLET_ADAPTERS.PHANTOM });

      if (!this._wallet) throw WalletInitializationError.notInstalled();
      if (!this._wallet.isConnected) {
        const handleDisconnect = this._wallet._handleDisconnect;
        try {
          await new Promise<void>((resolve, reject) => {
            const connect = async () => {
              this._wallet?.off("connect", connect);
              await this.connectWithProvider(this._wallet as PhantomWallet);
              resolve();
            };

            this._wallet?.on("connect", connect);

            this._wallet?.connect().catch((reason: any) => {
              this._wallet?.off("connect", connect);
              reject(reason);
            });

            (this._wallet as PhantomWallet)._handleDisconnect = (...args: unknown[]) => {
              this._wallet?.off("connect", connect);
              reject(WalletInitializationError.windowClosed());
              return handleDisconnect.apply(this._wallet, args);
            };
          });
        } catch (error: unknown) {
          if (error instanceof Web3AuthError) throw error;
          throw WalletLoginError.connectionError((error as Error)?.message);
        } finally {
          this._wallet._handleDisconnect = handleDisconnect;
        }
      } else {
        await this.connectWithProvider(this._wallet);
      }

      if (!this._wallet.publicKey) throw WalletLoginError.connectionError();
      this._wallet.on("disconnect", this._disconnected);
    } catch (error: unknown) {
      this.emit(ADAPTER_STATUS.ERRORED, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    try {
      await this._wallet?.disconnect();
      this.emit(ADAPTER_STATUS.DISCONNECTED);
    } catch (error: unknown) {
      this.emit(ADAPTER_STATUS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private _disconnected = () => {
    const wallet = this._wallet;
    if (this.isWalletConnected && wallet) {
      wallet.off("disconnect", this._disconnected);
      this._wallet = undefined;
      this.provider = undefined;
      this.status = ADAPTER_STATUS.DISCONNECTED;
      this.emit(ADAPTER_STATUS.DISCONNECTED);
    }
  };
}
