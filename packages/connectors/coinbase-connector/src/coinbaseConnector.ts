import CoinbaseWalletSDK, { ProviderInterface } from "@coinbase/wallet-sdk";
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
  UserInfo,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmConnector } from "@web3auth/base-evm-connector";

export type CoinbaseWalletSDKOptions = ConstructorParameters<typeof CoinbaseWalletSDK>[0];

export interface CoinbaseConnectorOptions extends BaseConnectorSettings {
  adapterSettings?: CoinbaseWalletSDKOptions;
}

export class CoinbaseConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_CONNECTORS.COINBASE;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public coinbaseInstance: CoinbaseWalletSDK | null = null;

  private coinbaseProvider: ProviderInterface | null = null;

  private coinbaseOptions: CoinbaseWalletSDKOptions = { appName: "Web3Auth" };

  constructor(adapterOptions: CoinbaseConnectorOptions = {}) {
    super(adapterOptions);
    this.setConnectorSettings(adapterOptions);
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.coinbaseProvider) {
      return this.coinbaseProvider as unknown as IProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  public setConnectorSettings(options: CoinbaseConnectorOptions): void {
    super.setConnectorSettings(options);
    this.coinbaseOptions = { ...this.coinbaseOptions, ...options.adapterSettings };
  }

  async init(options: ConnectorInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();
    this.coinbaseInstance = new CoinbaseWalletSDK({
      ...this.coinbaseOptions,
      appChainIds: [this.chainConfig.id],
    });
    this.coinbaseProvider = this.coinbaseInstance.makeWeb3Provider({ options: "all" });
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.COINBASE);
    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.coinbaseProvider) throw WalletLoginError.notConnectedError("Adapter is not initialized");
    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { adapter: WALLET_CONNECTORS.COINBASE });
    try {
      await this.coinbaseProvider.request({ method: "eth_requestAccounts" });
      const { chainId } = (await this.coinbaseProvider.request({ method: "eth_chainId" })) as { chainId: string };
      if (chainId !== this.chainConfig.id.toString(16)) {
        await this.addChain(this.chainConfig as CustomChainConfig);
        await this.switchChain({ chainId: this.chainConfig.id }, true);
      }
      this.status = CONNECTOR_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");
      this.provider.once("disconnect", () => {
        // ready to be connected again
        this.disconnect();
      });
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.COINBASE,
        reconnected: this.rehydrated,
        provider: this.provider,
      } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError("Failed to login with coinbase wallet");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.coinbaseProvider = null;
    } else {
      // ready to be connected again
      this.status = CONNECTOR_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    await this.coinbaseProvider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainConfig.id,
          chainName: chainConfig.name,
          rpcUrls: [chainConfig.rpcUrls.default.http[0]],
          blockExplorerUrls: [chainConfig.blockExplorers?.default?.url],
          nativeCurrency: {
            name: chainConfig.nativeCurrency.name,
            symbol: chainConfig.nativeCurrency.symbol,
            decimals: chainConfig.nativeCurrency.symbol || 18,
          },
          iconUrls: [chainConfig.logo],
        },
      ],
    });
    super.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.coinbaseProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId.toString(16) }],
    });
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}
