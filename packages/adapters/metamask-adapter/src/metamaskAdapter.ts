import detectEthereumProvider from "@metamask/detect-provider";
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

interface EthereumProvider extends SafeEventEmitterProvider {
  isMetaMask?: boolean;
  isConnected: () => boolean;
  chainId: string;
}
export type MetamaskAdapterOptions = BaseAdapterSettings;

class MetamaskAdapter extends BaseEvmAdapter<void> {
  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_ADAPTERS.METAMASK;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  private metamaskProvider: EthereumProvider | null = null;

  get provider(): SafeEventEmitterProvider | null {
    if (this.status === ADAPTER_STATUS.CONNECTED && this.metamaskProvider) {
      return this.metamaskProvider as SafeEventEmitterProvider;
    }
    return null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();
    this.metamaskProvider = (await detectEthereumProvider({ mustBeMetaMask: true })) as EthereumProvider;
    if (!this.metamaskProvider) throw WalletInitializationError.notInstalled("Metamask extension is not installed");
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.METAMASK);
    try {
      log.debug("initializing metamask adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      this.emit(ADAPTER_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Not able to connect with metamask");

    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.METAMASK });
    try {
      await this.metamaskProvider.request({ method: "eth_requestAccounts" });
      const { chainId } = this.metamaskProvider;
      if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
        await this.addChain(this.chainConfig as CustomChainConfig, true);
        await this.switchChain(this.chainConfig as CustomChainConfig, true);
      }
      this.status = ADAPTER_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");
      const disconnectHandler = () => {
        // ready to be connected again
        this.disconnect();
        this.provider?.removeListener("disconnect", disconnectHandler);
      };
      this.provider.on("disconnect", disconnectHandler);
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.METAMASK, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError("Failed to login with metamask wallet");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.metamaskProvider = null;
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
    super.checkAddChainRequirements(init);
    await this.metamaskProvider?.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainConfig.chainId,
          chainName: chainConfig.displayName,
          rpcUrls: [chainConfig.rpcTarget],
          blockExplorerUrls: [chainConfig.blockExplorer],
          nativeCurrency: {
            name: chainConfig.tickerName,
            symbol: chainConfig.ticker,
            decimals: chainConfig.decimals || 18,
          },
        },
      ],
    });
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.metamaskProvider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId }],
    });
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }
}

export { MetamaskAdapter };
