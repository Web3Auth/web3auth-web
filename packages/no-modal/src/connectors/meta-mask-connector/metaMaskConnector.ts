import { MetaMaskSDK, type MetaMaskSDKOptions, type SDKProvider } from "@metamask/sdk";

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
  IProvider,
  UserInfo,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";

import { BaseEvmConnector } from "../base-evm-connector";

export interface MetaMaskConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: MetaMaskSDKOptions;
}

class MetaMaskConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_CONNECTORS.METAMASK;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private metamaskProvider: SDKProvider | null = null;

  private metamaskSDK: MetaMaskSDK | null = null;

  private metamaskOptions: MetaMaskSDKOptions = { dappMetadata: { name: "Web3Auth" } };

  constructor(connectorOptions: MetaMaskConnectorOptions) {
    super(connectorOptions);
    this.metamaskOptions = { ...this.metamaskOptions, ...connectorOptions.connectorSettings };
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.metamaskProvider) {
      return this.metamaskProvider as unknown as IProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    await super.init(options);
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });

    this.metamaskSDK = new MetaMaskSDK(this.metamaskOptions);

    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
    try {
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
    if (!this.metamaskSDK) throw WalletLoginError.notConnectedError("Connector is not initialized");

    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.METAMASK });
    try {
      const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
      if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

      await this.metamaskSDK.connect();
      this.metamaskProvider = this.metamaskSDK.getProvider();

      const currentChainId = (await this.metamaskProvider.request({ method: "eth_chainId" })) as string;
      if (currentChainId !== chainConfig.chainId) {
        await this.switchChain(chainConfig, true);
      }
      this.status = CONNECTOR_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");
      this.provider.once("disconnect", () => {
        // ready to be connected again
        this.disconnect();
      });
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        provider: this.provider,
      } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError("Failed to login with MetaMask wallet", error);
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.metamaskProvider = null;
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

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.metamaskProvider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: params.chainId }] });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

export const metaMaskConnector = (params?: MetaMaskSDKOptions): ConnectorFn => {
  return ({ coreOptions }: ConnectorParams) => {
    return new MetaMaskConnector({ connectorSettings: params, coreOptions });
  };
};
