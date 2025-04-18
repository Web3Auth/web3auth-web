import { MetaMaskSDK, type MetaMaskSDKOptions } from "@metamask/sdk";
import deepmerge from "deepmerge";

import {
  BaseConnectorLoginParams,
  type BaseConnectorSettings,
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CONNECTOR_CATEGORY,
  type CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type ConnectorFn,
  type ConnectorInitOptions,
  type ConnectorNamespaceType,
  type ConnectorParams,
  type CustomChainConfig,
  type IProvider,
  type UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "../../base";
import { BaseEvmConnector } from "../base-evm-connector";
import { getSiteIcon, getSiteName } from "../utils";

export interface MetaMaskConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: MetaMaskSDKOptions;
}

class MetaMaskConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.METAMASK;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private metamaskProvider: IProvider = null;

  private metamaskSDK: MetaMaskSDK = null;

  private metamaskOptions: MetaMaskSDKOptions;

  constructor(connectorOptions: MetaMaskConnectorOptions) {
    super(connectorOptions);
    this.metamaskOptions = connectorOptions.connectorSettings;
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

    // Detect app metadata
    const iconUrl = await getSiteIcon(window);
    const appMetadata: MetaMaskSDKOptions["dappMetadata"] = {
      name: getSiteName(window),
      url: window.location.origin,
      iconUrl,
    };

    // Initialize the MetaMask SDK
    const metamaskOptions = deepmerge(this.metamaskOptions || {}, { dappMetadata: appMetadata });
    this.metamaskSDK = new MetaMaskSDK(metamaskOptions);

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

  async connect({ chainId }: BaseConnectorLoginParams): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.metamaskSDK) throw WalletLoginError.notConnectedError("Connector is not initialized");
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.METAMASK });
    try {
      await this.metamaskSDK.connect();
      this.metamaskProvider = this.metamaskSDK.getProvider() as unknown as IProvider;
      if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Failed to connect with provider");

      // switch chain if not connected to the right chain
      const currentChainId = (await this.metamaskProvider.request({ method: "eth_chainId" })) as string;
      if (currentChainId !== chainConfig.chainId) {
        await this.switchChain(chainConfig, true);
      }

      // handle disconnect event
      const accountDisconnectHandler = (accounts: string[]) => {
        if (accounts.length === 0) this.disconnect();
      };
      this.metamaskProvider.on("accountsChanged", accountDisconnectHandler);
      this.metamaskProvider.once("disconnect", () => {
        this.disconnect();
      });

      this.status = CONNECTOR_STATUS.CONNECTED;
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        provider: this.metamaskProvider,
      } as CONNECTED_EVENT_DATA);
      return this.metamaskProvider;
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
    if (!this.metamaskProvider) throw WalletLoginError.connectionError("MetaMask provider is not available");
    await super.disconnectSession();

    if (typeof this.metamaskProvider.removeAllListeners !== "undefined") this.metamaskProvider.removeAllListeners();
    await this.metamaskSDK.terminate();

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
    const requestSwitchChain = () => this.metamaskProvider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: params.chainId }] });
    try {
      await requestSwitchChain();
    } catch (error) {
      // If the error code is 4902, the network needs to be added
      if ((error as { code?: number })?.code === 4902) {
        const chainConfig = this.coreOptions.chains.find((x) => x.chainId === params.chainId && x.chainNamespace === this.connectorNamespace);
        await this.addChain(chainConfig);
        await requestSwitchChain();
      } else {
        throw error;
      }
    }
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  private async addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this.metamaskProvider) throw WalletLoginError.connectionError("Injected provider is not available");
    await this.metamaskProvider.request({
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
}

export const metaMaskConnector = (params?: MetaMaskSDKOptions): ConnectorFn => {
  return ({ coreOptions }: ConnectorParams) => {
    return new MetaMaskConnector({ connectorSettings: params, coreOptions });
  };
};
