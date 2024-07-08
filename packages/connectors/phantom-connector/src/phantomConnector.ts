import {
  BaseConnectorSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CONNECTOR_CATEGORY,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  ConnectorInitOptions,
  ConnectorNamespaceType,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseSolanaConnector } from "@web3auth/base-solana-connector";
import { IPhantomWalletProvider, PhantomInjectedProvider } from "@web3auth/solana-provider";

import { detectProvider } from "./utils";
export type PhantomConnectorOptions = BaseConnectorSettings;

export class PhantomConnector extends BaseSolanaConnector<void> {
  readonly name: string = WALLET_CONNECTORS.PHANTOM;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public _wallet: IPhantomWalletProvider | null = null;

  private phantomProvider: PhantomInjectedProvider | null = null;

  get isWalletConnected(): boolean {
    return !!(this._wallet?.isConnected && this.status === CONNECTOR_STATUS.CONNECTED);
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.phantomProvider) {
      return this.phantomProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();
    this._wallet = await detectProvider({ interval: 500, count: 3 });
    if (!this._wallet) throw WalletInitializationError.notInstalled();
    this.phantomProvider = new PhantomInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.PHANTOM);

    try {
      log.debug("initializing phantom connector");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached phantom provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<IProvider | null> {
    try {
      super.checkConnectionRequirements();
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.PHANTOM });

      if (!this._wallet) throw WalletInitializationError.notInstalled();
      if (!this._wallet.isConnected) {
        const handleDisconnect = this._wallet._handleDisconnect;
        try {
          await new Promise<IProvider | null>((resolve, reject) => {
            const connect = async () => {
              await this.connectWithProvider(this._wallet as IPhantomWalletProvider);
              resolve(this.provider);
            };
            if (!this._wallet) {
              reject(WalletInitializationError.notInstalled());
              return;
            }
            this._wallet.once("connect", connect);
            // Raise an issue on phantom that if window is closed, disconnect event is not fired
            (this._wallet as IPhantomWalletProvider)._handleDisconnect = (...args: unknown[]) => {
              reject(WalletInitializationError.windowClosed());
              return handleDisconnect.apply(this._wallet, args);
            };

            this._wallet.connect().catch((reason: unknown) => {
              reject(reason);
            });
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
      this._wallet.on("disconnect", this._onDisconnect);

      return this.provider;
    } catch (error: unknown) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
      throw error;
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    try {
      await this._wallet?.disconnect();
      if (options.cleanup) {
        this.status = CONNECTOR_STATUS.NOT_READY;
        this.phantomProvider = null;
        this._wallet = null;
      }
      await super.disconnect();
    } catch (error: unknown) {
      this.emit(CONNECTOR_EVENTS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    this.phantomProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.phantomProvider?.switchChain(params);
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  private async connectWithProvider(injectedProvider: IPhantomWalletProvider): Promise<IProvider | null> {
    if (!this.phantomProvider) throw WalletLoginError.connectionError("No phantom provider");
    await this.phantomProvider.setupProvider(injectedProvider);
    this.status = CONNECTOR_STATUS.CONNECTED;
    this.emit(CONNECTOR_EVENTS.CONNECTED, {
      connector: WALLET_CONNECTORS.PHANTOM,
      reconnected: this.rehydrated,
      provider: this.provider,
    } as CONNECTED_EVENT_DATA);
    return this.provider;
  }

  private _onDisconnect = () => {
    if (this._wallet) {
      this._wallet.off("disconnect", this._onDisconnect);
      this.rehydrated = false;
      // ready to be connected again only if it was previously connected and not cleaned up
      this.status = this.status === CONNECTOR_STATUS.CONNECTED ? CONNECTOR_STATUS.READY : CONNECTOR_STATUS.NOT_READY;
      this.emit(CONNECTOR_EVENTS.DISCONNECTED);
    }
  };
}
