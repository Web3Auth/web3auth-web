import Torus, { LoginParams, NetworkInterface, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
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
import { BaseEvmConnector } from "@web3auth/base-evm-connector";

export interface TorusWalletOptions extends BaseConnectorSettings {
  connectorSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: Omit<TorusParams, "network">;
}

export class TorusWalletConnector extends BaseEvmConnector<never> {
  readonly name: string = WALLET_CONNECTORS.TORUS_EVM;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public torusInstance: Torus | null = null;

  private torusWalletOptions?: TorusCtorArgs;

  private initParams?: TorusParams;

  private loginSettings?: LoginParams = {};

  constructor(params: TorusWalletOptions = {}) {
    super(params);
    this.torusWalletOptions = params.connectorSettings || {};
    this.initParams = params.initParams || {};
    this.loginSettings = params.loginSettings || {};
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.torusInstance) {
      return this.torusInstance.provider as unknown as IProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();

    const { id, blockExplorers, name, rpcUrls, nativeCurrency } = this.chainConfig as CustomChainConfig;
    const network: NetworkInterface = {
      chainId: id,
      host: rpcUrls?.default?.http?.[0],
      blockExplorer: blockExplorers?.default?.url,
      networkName: name,
      ticker: nativeCurrency?.symbol,
      tickerName: nativeCurrency?.name,
      // decimals: decimals || 18,
    };

    this.torusInstance = new Torus(this.torusWalletOptions);
    log.debug("initializing torus evm adapter init");
    await this.torusInstance.init({
      showTorusButton: false,
      ...this.initParams,
      network,
    });
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.TORUS_EVM);

    try {
      log.debug("initializing torus evm adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with torus evm provider", error);
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus wallet is not initialized");
    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { adapter: WALLET_CONNECTORS.TORUS_EVM });
    try {
      await this.torusInstance.login(this.loginSettings);
      const chainId = await this.torusInstance.provider.request<string>({ method: "eth_chainId" });
      if (chainId && parseInt(chainId) !== this.chainConfig.id) {
        const { id: _chainId, blockExplorers, name, rpcUrls, nativeCurrency } = this.chainConfig as CustomChainConfig;
        const network: NetworkInterface = {
          chainId: _chainId,
          host: rpcUrls?.default?.http?.[0],
          blockExplorer: blockExplorers?.default?.url,
          networkName: name,
          tickerName: nativeCurrency?.symbol,
          ticker: nativeCurrency?.name,
        };
        // in some cases when user manually switches chain and relogin then adapter will not connect to initially passed
        // chainConfig but will connect to the one that user switched to.
        // So here trying to switch network to the one that was initially passed in chainConfig.
        await this.torusInstance.setProvider({
          ...network,
        });
        const updatedChainID = await this.torusInstance.ethereum.request<string>({ method: "eth_chainId" });
        if (updatedChainID && parseInt(updatedChainID) !== this.chainConfig.id) {
          throw WalletInitializationError.fromCode(
            5000,
            `Not connected to correct chainId. Expected: ${this.chainConfig.id}, Current: ${updatedChainID}`
          );
        }
      }
      this.status = CONNECTOR_STATUS.CONNECTED;
      this.torusInstance.showTorusButton();
      this.emit(CONNECTOR_STATUS.CONNECTED, { connector: WALLET_CONNECTORS.TORUS_EVM, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_STATUS.ERRORED, error);
      throw error instanceof Web3AuthError ? error : WalletLoginError.connectionError("Failed to login with torus wallet");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus wallet is not initialized");
    await this.torusInstance.logout();
    this.torusInstance.hideTorusButton();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.torusInstance = null;
    } else {
      // ready to be connected again
      this.status = CONNECTOR_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus wallet is not initialized");
    const userInfo = await this.torusInstance.getUserInfo("");
    return userInfo;
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    // TODO: add these in torus wallet.
    // await this.torusInstance?.provider.request({
    //   method: "wallet_addEthereumChain",
    //   params: [
    //     {
    //       chainId: chainConfig.chainId,
    //       chainName: chainConfig.displayName,
    //       rpcUrls: [chainConfig.rpcTarget],
    //       blockExplorerUrls: [chainConfig.blockExplorer],
    //       nativeCurrency: {
    //         name: chainConfig.tickerName,
    //         symbol: chainConfig.ticker,
    //         decimals: chainConfig.decimals || 18,
    //       },
    //     },
    //   ],
    // });
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    // TODO: add these in torus wallet.
    // await this.torusInstance?.provider.request({
    //   method: "wallet_switchEthereumChain",
    //   params: [{ chainId: params.chainId }],
    // });
    const chainConfig = this.getChainConfig(params.chainId) as CustomChainConfig;
    await this.torusInstance?.setProvider({
      host: chainConfig.rpcUrls?.default?.http?.[0],
      chainId: chainConfig.id,
      networkName: chainConfig.name,
      blockExplorer: chainConfig.blockExplorers?.default?.url,
      ticker: chainConfig.nativeCurrency?.symbol,
      tickerName: chainConfig.nativeCurrency?.name,
    });
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}
