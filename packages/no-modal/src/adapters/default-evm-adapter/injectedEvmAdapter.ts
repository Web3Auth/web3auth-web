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
  ConnectorFn,
  ConnectorInitOptions,
  ConnectorNamespaceType,
  ConnectorParams,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";

import { BaseEvmConnector } from "../base-evm-adapter";

class InjectedEvmConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: string;

  readonly isInjected = true;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private injectedProvider: IProvider | null = null;

  constructor(options: BaseConnectorSettings & { name: string; provider: IProvider }) {
    super(options);
    this.name = options.name;
    this.injectedProvider = options.provider;
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.injectedProvider) {
      return this.injectedProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    await super.init(options);
    const chainConfig = this.coreOptions.chainConfigs.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, this.name);
    try {
      log.debug(`initializing ${this.name} injected connector`);
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect({ chainId: options.chainId });
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect({ chainId }: { chainId: string }): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.injectedProvider) throw WalletLoginError.connectionError("Injected provider is not available");
    const chainConfig = this.coreOptions.chainConfigs.find((x) => x.chainId === chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: this.name });
    try {
      await this.injectedProvider.request({ method: "eth_requestAccounts" });
      // switch chain if not connected to the right chain
      if (this.injectedProvider.chainId !== chainConfig.chainId) {
        try {
          await this.switchChain(chainConfig, true);
        } catch (error) {
          await this.addChain(chainConfig, true);
          await this.switchChain(chainConfig, true);
        }
      }
      this.status = CONNECTOR_STATUS.CONNECTED;
      const accountDisconnectHandler = (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
          if (this.injectedProvider?.removeListener) this.injectedProvider.removeListener("accountsChanged", accountDisconnectHandler);
        }
      };
      this.injectedProvider.on("accountsChanged", accountDisconnectHandler);
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: this.name,
        reconnected: this.rehydrated,
        provider: this.injectedProvider,
      } as CONNECTED_EVENT_DATA);
      return this.injectedProvider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError(`Failed to login with ${this.name} injected wallet`);
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (!this.injectedProvider) throw WalletLoginError.connectionError("Injected provider is not available");
    await super.disconnectSession();
    if (typeof this.injectedProvider.removeAllListeners !== "undefined") this.injectedProvider.removeAllListeners();
    try {
      await this.injectedProvider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch (error) {}
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.injectedProvider = null;
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

  public async addChain(chainConfig: CustomChainConfig, _init = false): Promise<void> {
    if (!this.injectedProvider) throw WalletLoginError.connectionError("Injected provider is not available");
    await this.injectedProvider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainConfig.chainId,
          chainName: chainConfig.displayName,
          rpcUrls: [chainConfig.rpcTarget],
          blockExplorerUrls: [chainConfig.blockExplorerUrl],
          nativeCurrency: { name: chainConfig.tickerName, symbol: chainConfig.ticker, decimals: chainConfig.decimals || 18 },
          iconUrls: [chainConfig.logo],
        },
      ],
    });
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    if (!this.injectedProvider) throw WalletLoginError.connectionError("Injected provider is not available");
    super.checkSwitchChainRequirements(params, init);
    await this.injectedProvider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: params.chainId }] });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

export const injectedEvmConnector = (params: { name: string; provider: IProvider }): ConnectorFn => {
  const { name, provider } = params;
  return ({ coreOptions }: ConnectorParams) => {
    return new InjectedEvmConnector({
      name,
      provider,
      coreOptions,
    });
  };
};

export { InjectedEvmConnector };
