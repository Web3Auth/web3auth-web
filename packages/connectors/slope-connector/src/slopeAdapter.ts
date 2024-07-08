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
import { ISlopeProvider, SlopeInjectedProxyProvider } from "@web3auth/solana-provider";

import { detectProvider } from "./utils";

export type SlopeWalletOptions = BaseConnectorSettings;

export class SlopeConnector extends BaseSolanaConnector<void> {
  readonly name: string = WALLET_CONNECTORS.SLOPE;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public _wallet: ISlopeProvider | null = null;

  private slopeProxyProvider: SlopeInjectedProxyProvider | null = null;

  get isWalletConnected(): boolean {
    return this.status === CONNECTOR_STATUS.CONNECTED;
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.slopeProxyProvider) {
      return this.slopeProxyProvider;
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
    this.slopeProxyProvider = new SlopeInjectedProxyProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.SLOPE);

    try {
      log.debug("initializing slope adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached slope provider", error);
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<IProvider | null> {
    try {
      super.checkConnectionRequirements();
      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, { adapter: WALLET_CONNECTORS.SLOPE });

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
        this.slopeProxyProvider = null;
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
    this.slopeProxyProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.slopeProxyProvider?.switchChain(params);
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  private async connectWithProvider(injectedProvider: ISlopeProvider): Promise<IProvider | null> {
    if (!this.slopeProxyProvider) throw WalletLoginError.connectionError("No Slope provider found");
    await this.slopeProxyProvider.setupProvider(injectedProvider);
    this.status = CONNECTOR_STATUS.CONNECTED;
    this.emit(CONNECTOR_EVENTS.CONNECTED, {
      connector: WALLET_CONNECTORS.SLOPE,
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
