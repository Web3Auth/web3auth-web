import Torus, { LoginParams, NetworkInterface, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapterSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  log,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";

export interface TorusWalletOptions extends BaseAdapterSettings {
  adapterSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: Omit<TorusParams, "network">;
}

export class TorusWalletAdapter extends BaseEvmAdapter<never> {
  readonly name: string = WALLET_ADAPTERS.TORUS_EVM;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public torusInstance: Torus | null = null;

  private torusWalletOptions?: TorusCtorArgs;

  private initParams?: TorusParams;

  private loginSettings?: LoginParams = {};

  constructor(params: TorusWalletOptions = {}) {
    super(params);
    this.torusWalletOptions = params.adapterSettings || {};
    this.initParams = params.initParams || {};
    this.loginSettings = params.loginSettings || {};
  }

  get provider(): SafeEventEmitterProvider | null {
    if (this.status === ADAPTER_STATUS.CONNECTED && this.torusInstance) {
      return this.torusInstance.provider as unknown as SafeEventEmitterProvider;
    }
    return null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();

    const { chainId, blockExplorer, displayName, rpcTarget, ticker, tickerName } = this.chainConfig as CustomChainConfig;
    const network: NetworkInterface = {
      chainId: Number.parseInt(chainId, 16),
      host: rpcTarget,
      blockExplorer,
      networkName: displayName,
      ticker,
      tickerName,
      // decimals: decimals || 18,
    };

    this.torusInstance = new Torus(this.torusWalletOptions);
    log.debug("initializing torus evm adapter init");
    await this.torusInstance.init({
      showTorusButton: false,
      ...this.initParams,
      network,
    });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.TORUS_EVM);

    try {
      log.debug("initializing torus evm adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with torus evm provider", error);
      this.emit(ADAPTER_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus wallet is not initialized");
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.TORUS_EVM });
    try {
      await this.torusInstance.login(this.loginSettings);
      const { chainId } = this.torusInstance.provider;
      if (chainId && parseInt(chainId) !== parseInt((this.chainConfig as CustomChainConfig).chainId, 16)) {
        const { chainId: _chainId, blockExplorer, displayName, rpcTarget, ticker, tickerName } = this.chainConfig as CustomChainConfig;
        const network: NetworkInterface = {
          chainId: Number.parseInt(_chainId, 16),
          host: rpcTarget,
          blockExplorer,
          networkName: displayName,
          tickerName,
          ticker,
        };
        // in some cases when user manually switches chain and relogin then adapter will not connect to initially passed
        // chainConfig but will connect to the one that user switched to.
        // So here trying to switch network to the one that was initially passed in chainConfig.
        await this.torusInstance.setProvider({
          ...network,
        });
        const updatedChainID = await this.torusInstance.ethereum.request<string>({ method: "eth_chainId" });
        if (updatedChainID && parseInt(updatedChainID) !== parseInt((this.chainConfig as CustomChainConfig).chainId, 16)) {
          throw WalletInitializationError.fromCode(
            5000,
            `Not connected to correct chainId. Expected: ${(this.chainConfig as CustomChainConfig).chainId}, Current: ${updatedChainID}`
          );
        }
      }
      this.status = ADAPTER_STATUS.CONNECTED;
      this.torusInstance.showTorusButton();
      this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.TORUS_EVM, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_STATUS.ERRORED, error);
      throw error instanceof Web3AuthError ? error : WalletLoginError.connectionError("Failed to login with torus wallet");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus wallet is not initialized");
    await this.torusInstance.logout();
    this.torusInstance.hideTorusButton();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.torusInstance = null;
    } else {
      // ready to be connected again
      this.status = ADAPTER_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus wallet is not initialized");
    const userInfo = await this.torusInstance.getUserInfo("");
    return userInfo;
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(init);
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

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    // TODO: add these in torus wallet.
    // await this.torusInstance?.provider.request({
    //   method: "wallet_switchEthereumChain",
    //   params: [{ chainId: params.chainId }],
    // });
    const chainConfig = this.getChainConfig(params.chainId) as CustomChainConfig;
    await this.torusInstance?.setProvider({
      host: chainConfig.rpcTarget,
      chainId: parseInt(chainConfig.chainId, 16),
      networkName: chainConfig.displayName,
      blockExplorer: chainConfig.blockExplorer,
      ticker: chainConfig.ticker,
      tickerName: chainConfig.tickerName,
    });
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }
}
