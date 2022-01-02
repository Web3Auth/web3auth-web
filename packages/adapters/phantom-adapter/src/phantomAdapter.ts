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
  PROVIDER_EVENTS,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import type { PhantomWallet, SolanaInjectedProviderProxy } from "@web3auth/solana-provider";
import log from "loglevel";

import { poll } from "./utils";

class PhantomAdapter extends BaseAdapter<void> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public provider: SafeEventEmitterProvider;

  public _wallet: PhantomWallet;

  public connected: boolean;

  private solanaProviderFactory: SolanaInjectedProviderProxy;

  get isPhantomAvailable(): boolean {
    return typeof window !== "undefined" && !!(window as any).solana?.isPhantom;
  }

  get isWalletConnected(): boolean {
    return this._wallet && this._wallet.isConnected && this.connected;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    if (this.ready) return;
    const isAvailable = this.isPhantomAvailable || (await poll(() => this.isPhantomAvailable, 1000, 3));
    if (!isAvailable) throw WalletInitializationError.notInstalled();
    const { SolanaInjectedProviderProxy } = await import("@web3auth/solana-provider");
    this.solanaProviderFactory = new SolanaInjectedProviderProxy({});
    await this.solanaProviderFactory.init();
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

  async subscribeToProviderEvents(injectedProvider: PhantomWallet): Promise<SafeEventEmitterProvider | null> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (this.solanaProviderFactory.state._errored) {
        this.emit(BASE_ADAPTER_EVENTS.ERRORED, this.solanaProviderFactory.state.error);
        reject(this.solanaProviderFactory.state.error);
        return;
      }
      const getProvider = async (): Promise<SafeEventEmitterProvider | null> => {
        return this.solanaProviderFactory.setupProviderFromInjectedProvider(injectedProvider);
      };
      if (this.solanaProviderFactory.state._initialized) {
        this.provider = await getProvider();
        this.connected = true;
        this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.PHANTOM);
        resolve(this.provider);
        return;
      }
      this.solanaProviderFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        this.provider = await getProvider();
        this.connected = true;
        this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.PHANTOM);
        resolve(this.provider);
      });
      this.solanaProviderFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
        this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
        reject(error);
      });
    });
  }

  async connect(): Promise<SafeEventEmitterProvider> {
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
              await this.subscribeToProviderEvents(wallet);
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
      this.provider = undefined;
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
    } catch (error: any) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, WalletLoginError.disconnectionError(error?.message));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  setChainConfig(_: CustomChainConfig): void {}

  private _disconnected = () => {
    const wallet = this._wallet;
    if (this.isWalletConnected) {
      wallet.off("disconnect", this._disconnected);
      this._wallet = null;
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
    }
  };
}

export { PhantomAdapter };
