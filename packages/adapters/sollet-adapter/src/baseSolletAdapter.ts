/* eslint-disable @typescript-eslint/no-explicit-any */
import SolletWallet from "@project-serum/sol-wallet-adapter";
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
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { SolletInjectedProvider } from "@web3auth/solana-provider";

import { detectProvider, getChainNameById, SolletProvider } from "./utils";

export interface SolletAdapterOptions {
  chainConfig?: CustomChainConfig;
  provider?: string;
}

export class BaseSolletAdapter extends BaseAdapter<void> {
  readonly name: string = "";

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public _wallet: SolletWallet | null = null;

  protected _provider: string | SolletProvider | undefined;

  private solletProvider: SolletInjectedProvider | null = null;

  private rehydrated = false;

  constructor({ provider, chainConfig }: SolletAdapterOptions = {}) {
    super();
    this.chainConfig = chainConfig || null;
    this._provider = provider;
  }

  get isWalletConnected(): boolean {
    return !!(this._wallet?.connected && this.status === ADAPTER_STATUS.CONNECTED);
  }

  public get provider(): SafeEventEmitterProvider | null {
    return this.solletProvider?.provider || null;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    // set chainConfig for mainnet by default if not set
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
    }

    if (typeof this._provider !== "string") {
      this._provider = await detectProvider({ interval: 500, count: 3 });
      if (!this._provider) throw WalletInitializationError.notInstalled();
    }

    this.solletProvider = new SolletInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, this.name);

    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached sollet provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    try {
      super.checkConnectionRequirements();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: this.name });

      const network = getChainNameById(this.chainConfig?.chainId);
      if (network === "") {
        throw WalletLoginError.connectionError("Invalid chainId, Sollet doesn't support custom solana networks");
      }

      if (!this._provider) throw WalletInitializationError.notInstalled();
      const wallet = new SolletWallet(this._provider, network);

      if (!wallet.connected) {
        const { handleDisconnect } = wallet as any;
        try {
          // work-around: sol-wallet-adapter doesn't reject or emit an event if the popup or extension is closed or blocked
          await new Promise<void>((resolve, reject) => {
            const connect = async () => {
              await this.connectWithProvider(wallet);
              wallet.off("connect", connect);
              resolve();
            };

            (wallet as any).handleDisconnect = (...args: unknown[]): void => {
              wallet.off("connect", connect);
              reject(WalletInitializationError.windowClosed());
              return handleDisconnect.apply(wallet, args);
            };

            wallet.on("connect", connect);
            wallet.connect().catch((reason: unknown) => {
              wallet.off("connect", connect);
              reject(reason);
            });
            if (typeof this._provider === "string") {
              let count = 0;
              setInterval(() => {
                const popup = (wallet as any)._popup;
                if (popup) {
                  if (popup.closed) reject(WalletLoginError.connectionError("close error"));
                } else if (count > 50) reject(WalletLoginError.connectionError("window blocked error"));
                count++;
              }, 100);
            } else {
              setTimeout(() => reject(WalletLoginError.connectionError("timeout error")), 10000);
            }
          });
        } catch (error: unknown) {
          if (error instanceof Web3AuthError) throw error;
          throw WalletLoginError.connectionError((error as Error)?.message);
        } finally {
          (wallet as any).handleDisconnect = handleDisconnect;
        }
      } else {
        await this.connectWithProvider(wallet);
      }

      if (!wallet.publicKey) throw WalletLoginError.connectionError();
      wallet.on("disconnect", this._onDisconnect);
      this._wallet = wallet;

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
    const wallet = this._wallet;
    if (!wallet || !this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    wallet.off("disconnect", this._onDisconnect);
    this._wallet = null;

    // work-around: sol-wallet-adapter doesn't reliably fulfill its promise or emit an event on disconnect
    const { handleDisconnect } = wallet as any;
    try {
      await new Promise<void>((resolve, reject) => {
        (wallet as any).handleDisconnect = (...args: unknown[]): unknown => {
          resolve();
          // work-around: sol-wallet-adapter rejects with an uncaught promise error
          (wallet as any)._responsePromises = new Map();
          return handleDisconnect.apply(wallet, args);
        };

        wallet
          .disconnect()
          .then(() => {
            return resolve();
          })
          .catch((error) => {
            // work-around: sol-wallet-adapter rejects with an error on disconnect
            if (error?.message === "Wallet disconnected") {
              resolve();
            } else {
              reject(error);
            }
          });
      });
      if (options.cleanup) {
        this.status = ADAPTER_STATUS.NOT_READY;
        this.solletProvider = null;
        this._wallet = null;
      } else {
        this.status = ADAPTER_STATUS.READY;
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

  private async connectWithProvider(injectedProvider: SolletWallet): Promise<SafeEventEmitterProvider | null> {
    if (!this.solletProvider) throw WalletLoginError.connectionError("No sollet provider");
    await this.solletProvider.setupProvider(injectedProvider);
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: this.name, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
    return this.provider;
  }

  private _onDisconnect = () => {
    const wallet = this._wallet;
    if (wallet) {
      wallet.off("disconnect", this._onDisconnect);

      this._wallet = null;

      // ready to be connected again only if it was previously connected and not cleaned up
      this.status = this.status === ADAPTER_STATUS.CONNECTED ? ADAPTER_STATUS.READY : ADAPTER_STATUS.NOT_READY;
      this.emit(ADAPTER_EVENTS.DISCONNECTED);
    }
  };
}
