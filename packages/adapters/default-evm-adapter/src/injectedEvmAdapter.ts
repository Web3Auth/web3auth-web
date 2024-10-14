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
  IProvider,
  log,
  UserInfo,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";

class InjectedEvmAdapter extends BaseEvmAdapter<void> {
  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly name: string;

  readonly isInjected = true;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  private injectedProvider: IProvider | null = null;

  constructor(options: BaseAdapterSettings & { name: string; provider: IProvider }) {
    super(options);
    this.name = options.name;
    this.injectedProvider = options.provider;
  }

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY && this.injectedProvider) {
      return this.injectedProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, this.name);
    try {
      log.debug(`initializing ${this.name} injected adapter`);
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect(): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.injectedProvider) throw WalletLoginError.connectionError("Injected provider is not available");
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: this.name });
    try {
      await this.injectedProvider.request({ method: "eth_requestAccounts" });
      // switch chain if not connected to the right chain
      if (this.injectedProvider.chainId !== this.chainConfig.chainId) {
        try {
          await this.switchChain(this.chainConfig, true);
        } catch (error) {
          await this.addChain(this.chainConfig, true);
          await this.switchChain(this.chainConfig, true);
        }
      }
      this.status = ADAPTER_STATUS.CONNECTED;
      const chainDisconnectHandler = () => {
        this.disconnect();
        if (this.injectedProvider.removeListener) this.injectedProvider.removeListener("disconnect", chainDisconnectHandler);
      };
      this.injectedProvider.on("disconnect", chainDisconnectHandler);
      const accountDisconnectHandler = (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
          if (this.injectedProvider.removeListener) this.injectedProvider.removeListener("accountsChanged", accountDisconnectHandler);
        }
      };
      this.injectedProvider.on("accountsChanged", accountDisconnectHandler);
      this.emit(ADAPTER_EVENTS.CONNECTED, {
        adapter: this.name,
        reconnected: this.rehydrated,
        provider: this.injectedProvider,
      } as CONNECTED_EVENT_DATA);
      return this.injectedProvider;
    } catch (error) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError(`Failed to login with ${this.name} injected wallet`);
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    if (typeof this.injectedProvider?.removeAllListeners !== "undefined") this.injectedProvider?.removeAllListeners();
    try {
      await this.injectedProvider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {}
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.injectedProvider = null;
    } else {
      // ready to be connected again
      this.status = ADAPTER_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    await this.injectedProvider?.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainConfig.chainId,
          chainName: chainConfig.displayName,
          rpcUrls: [chainConfig.rpcTarget],
          blockExplorerUrls: [chainConfig.blockExplorerUrl],
          nativeCurrency: {
            name: chainConfig.tickerName,
            symbol: chainConfig.ticker,
            decimals: chainConfig.decimals || 18,
          },
          iconUrls: [chainConfig.logo],
        },
      ],
    });
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.injectedProvider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId }],
    });
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

export { InjectedEvmAdapter };
