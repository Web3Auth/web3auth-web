import type { Cluster } from "@solana/web3.js";
import SolflareClass from "@solflare-wallet/sdk";
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
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseSolanaConnector } from "@web3auth/base-solana-connector";
import { SolflareInjectedProvider, SolflareWallet } from "@web3auth/solana-provider";

export type SolflareWalletOptions = BaseConnectorSettings;

export class SolflareConnector extends BaseSolanaConnector<void> {
  readonly name: string = WALLET_CONNECTORS.SOLFLARE;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public _wallet: SolflareClass | null = null;

  private solflareProvider: SolflareInjectedProvider | null = null;

  get isWalletConnected(): boolean {
    return !!(this._wallet?.isConnected && this.status === CONNECTOR_STATUS.CONNECTED);
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.solflareProvider) {
      return this.solflareProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();
    this.solflareProvider = new SolflareInjectedProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.SOLFLARE);

    try {
      log.debug("initializing solflare connector");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached solflare provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<IProvider | null> {
    try {
      super.checkConnectionRequirements();
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.SOLFLARE });
      let cluster: Cluster = "mainnet-beta";
      if (this.chainConfig?.id === 1) {
        cluster = "mainnet-beta";
      } else if (this.chainConfig?.id === 2) {
        cluster = "devnet";
      } else if (this.chainConfig?.id === 3) {
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
      await this.connectWithProvider(wallet as SolflareWallet);

      this._wallet = wallet;

      if (!wallet.publicKey) throw WalletLoginError.connectionError();
      wallet.on("disconnect", this._onDisconnect);

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
    await await super.disconnectSession();
    try {
      await this._wallet?.disconnect();
      if (options.cleanup) {
        this.status = CONNECTOR_STATUS.NOT_READY;
        this.solflareProvider = null;
        this._wallet = null;
      } else {
        this.status = CONNECTOR_STATUS.READY;
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
    this.solflareProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.solflareProvider?.switchChain(params);
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  private async connectWithProvider(injectedProvider: SolflareWallet): Promise<IProvider | null> {
    if (!this.solflareProvider) throw WalletLoginError.connectionError("No solflare provider");
    await this.solflareProvider.setupProvider(injectedProvider);
    this.status = CONNECTOR_STATUS.CONNECTED;
    this.emit(CONNECTOR_EVENTS.CONNECTED, {
      connector: WALLET_CONNECTORS.SOLFLARE,
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
