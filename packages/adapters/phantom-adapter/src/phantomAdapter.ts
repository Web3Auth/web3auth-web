import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterInitOptions,
  AdapterNamespaceType,
  BASE_ADAPTER_EVENTS,
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
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting = false;

  public ready = false;

  public provider!: SafeEventEmitterProvider | undefined;

  public _wallet!: PhantomWallet | undefined;

  public connected = false;

  private phantomProvider!: PhantomInjectedProvider;

  constructor(options: PhantomAdapterOptions = {}) {
    super();
    this.chainConfig = options.chainConfig;
  }

  get isPhantomAvailable(): boolean {
    return typeof window !== "undefined" && !!(window as any).solana?.isPhantom;
  }

  get isWalletConnected(): boolean {
    return !!(this._wallet && this._wallet.isConnected && this.connected);
  }

  setAdapterSettings(_: unknown): void {}

  async init(options: AdapterInitOptions): Promise<void> {
    // set chainConfig for mainnet by default if not set
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
    }
    if (this.ready) return;
    const isAvailable = this.isPhantomAvailable || (await poll(() => this.isPhantomAvailable, 1000, 3));
    if (!isAvailable) throw WalletInitializationError.notInstalled();
    const { PhantomInjectedProvider } = await import("@web3auth/solana-provider");
    this.phantomProvider = new PhantomInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.ready = true;
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.PHANTOM);

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
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const getProvider = async (): Promise<SafeEventEmitterProvider> => {
        return this.phantomProvider.setupProvider(injectedProvider);
      };
      this.provider = await getProvider();
      this.connected = true;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.PHANTOM);
      resolve(this.provider);
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.ready) throw WalletInitializationError.notReady("Phantom wallet adapter is not ready, please init first");
      if (this.connected || this.connecting) return;
      this.connecting = true;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.PHANTOM });

      const isAvailable = this.isPhantomAvailable || (await poll(() => this.isPhantomAvailable, 1000, 3));
      if (!isAvailable) throw WalletInitializationError.notInstalled();

      const wallet = typeof window !== "undefined" && (window as any).solana;

      if (!wallet.isConnected) {
        // HACK: Phantom doesn't reject or emit an event if the popup is closed
        const handleDisconnect = wallet._handleDisconnect;
        try {
          await new Promise<void>((resolve, reject) => {
            const connect = async () => {
              wallet.off("connect", connect);
              await this.connectWithProvider(wallet);
              resolve();
            };

            wallet._handleDisconnect = (...args: unknown[]) => {
              wallet.off("connect", connect);
              reject(WalletInitializationError.windowClosed());
              return handleDisconnect.apply(wallet, args);
            };

            wallet.on("connect", connect);

            wallet.connect().catch((reason: any) => {
              wallet.off("connect", connect);
              reject(reason);
            });
          });
        } catch (error: any) {
          if (error instanceof Web3AuthError) throw error;
          throw WalletLoginError.connectionError(error?.message);
        } finally {
          // eslint-disable-next-line require-atomic-updates
          wallet._handleDisconnect = handleDisconnect;
        }
      } else {
        await this.connectWithProvider(wallet);
      }

      if (!wallet.publicKey) throw WalletLoginError.connectionError();
      this._wallet = wallet;
      wallet.on("disconnect", this._disconnected);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    try {
      await this._wallet?.disconnect();
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
    } catch (error: unknown) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message));
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
      this.connected = false;
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
    }
  };
}
