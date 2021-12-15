import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  PROVIDER_EVENTS,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletDisconnectionError,
  WalletError,
  WalletNotConnectedError,
  WalletNotFoundError,
  WalletNotInstalledError,
  WalletNotReadyError,
  WalletWindowClosedError,
} from "@web3auth/base";
import type { SolanaInjectedProviderProxy, SolanaWallet } from "@web3auth/solana-provider";

interface PhantomWallet extends SolanaWallet {
  isPhantom?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  _handleDisconnect(...args: unknown[]): unknown;
}

class PhantomAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public provider: SafeEventEmitterProvider;

  public _wallet: PhantomWallet;

  private solanaProviderFactory: SolanaInjectedProviderProxy;

  get connected() {
    return this._wallet?.isConnected && this.solanaProviderFactory?.state._initialized;
  }

  async init(options: { connect: boolean }): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("Initializing Phantom Wallet Adapter");
    if (this.ready) return;
    const wallet = typeof window !== "undefined" && (window as any).solana;
    if (!wallet) throw new WalletNotFoundError();
    if (!wallet.isPhantom) throw new WalletNotInstalledError();
    const { SolanaInjectedProviderProxy } = await import("@web3auth/solana-provider");
    this.solanaProviderFactory = new SolanaInjectedProviderProxy({});
    await this.solanaProviderFactory.init();
    if (options.connect && wallet.isConnected) {
      await this.subscribeToProviderEvents(wallet);
    }
    this.ready = true;
    // eslint-disable-next-line no-console
    console.log("initialized Phantom Wallet Adapter");
  }

  async subscribeToProviderEvents(injectedProvider: PhantomWallet): Promise<SafeEventEmitterProvider | null> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (this.solanaProviderFactory.state._errored) {
        this.emit(BASE_WALLET_EVENTS.ERRORED, this.solanaProviderFactory.state.error);
        reject(this.solanaProviderFactory.state.error);
        return;
      }
      const getProvider = async (): Promise<SafeEventEmitterProvider | null> => {
        return this.solanaProviderFactory.setupProviderFromInjectedProvider({ provider: injectedProvider });
      };
      if (this.solanaProviderFactory.state._initialized) {
        this.provider = await getProvider();
        this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.PHANTOM_WALLET);
        resolve(this.provider);
        return;
      }
      this.solanaProviderFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        this.provider = await getProvider();
        this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.PHANTOM_WALLET);
        resolve(this.provider);
      });
      this.solanaProviderFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
        this.emit(BASE_WALLET_EVENTS.ERRORED, error);
        reject(error);
      });
    });
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    try {
      if (!this.ready) throw new WalletNotReadyError("Phantom wallet adapter is not ready, please init first");
      if (this.connected || this.connecting) return;
      this.connecting = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTING);

      const wallet = typeof window !== "undefined" && (window as any).solana;
      if (!wallet) throw new WalletNotFoundError();
      if (!wallet.isPhantom) throw new WalletNotInstalledError();

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
              reject(new WalletWindowClosedError());
              return handleDisconnect.apply(wallet, args);
            };

            wallet.on("connect", connect);

            wallet.connect().catch((reason: any) => {
              wallet.off("connect", connect);
              reject(reason);
            });
          });
        } catch (error: any) {
          if (error instanceof WalletError) throw error;
          throw new WalletConnectionError(error?.message, error);
        } finally {
          // eslint-disable-next-line require-atomic-updates
          wallet._handleDisconnect = handleDisconnect;
        }
      }

      if (!wallet.publicKey) throw new WalletConnectionError();
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
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet");
    this.provider?.removeAllListeners();
    try {
      await this._wallet?.disconnect();
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
    } catch (error: any) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, new WalletDisconnectionError(error?.message, error));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private _disconnected = () => {
    const wallet = this._wallet;
    if (wallet && this.connected) {
      wallet.off("disconnect", this._disconnected);
      this._wallet = null;
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
    }
  };
}

export { PhantomAdapter };
