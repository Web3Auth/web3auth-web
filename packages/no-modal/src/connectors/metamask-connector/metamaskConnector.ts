import { MetaMaskSDK, type MetaMaskSDKOptions } from "@metamask/sdk";
import { getErrorAnalyticsProperties } from "@toruslabs/base-controllers";
import deepmerge from "deepmerge";

import {
  AddEthereumChainConfig,
  type Analytics,
  ANALYTICS_EVENTS,
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
  getCaipChainId,
  IdentityTokenInfo,
  type IProvider,
  type MetaMaskConnectorData,
  type UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "../../base";
import { BaseEvmConnector } from "../base-evm-connector";
import { getSiteIcon, getSiteName } from "../utils";

export interface MetaMaskConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Partial<MetaMaskSDKOptions>;
}

class MetaMaskConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.METAMASK;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private metamaskProvider: IProvider = null;

  private metamaskSDK: MetaMaskSDK = null;

  private metamaskOptions: Partial<MetaMaskSDKOptions>;

  private analytics?: Analytics;

  constructor(connectorOptions: MetaMaskConnectorOptions) {
    super(connectorOptions);
    this.metamaskOptions = connectorOptions.connectorSettings;
    this.analytics = connectorOptions.analytics;
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
    // TODO: handle ssr
    const appMetadata: MetaMaskSDKOptions["dappMetadata"] = {
      name: getSiteName(window) || "web3auth",
      url: window.location.origin || "https://web3auth.io",
      iconUrl: iconUrl ?? undefined,
    };

    // initialize the MetaMask SDK
    const metamaskOptions = deepmerge(this.metamaskOptions || {}, { dappMetadata: appMetadata });
    this.metamaskSDK = new MetaMaskSDK({ ...metamaskOptions, _source: "web3auth", preferDesktop: true });
    // Work around: in case there is an existing SDK instance in memory (window.mmsdk exists), it won't initialize the new SDK instance again
    // and return the existing instance instead of undefined (this is an assumption, not sure if it's a bug or feature of the MetaMask SDK)
    const initResult = await this.metamaskSDK.init();
    if (initResult) {
      this.metamaskSDK = initResult;
    }
    this.isInjected = this.metamaskSDK.isExtensionActive();

    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        const provider = await this.connect({ chainId: options.chainId, getIdentityToken: false });
        if (!provider) {
          this.rehydrated = false;
          throw WalletLoginError.connectionError("Failed to rehydrate.");
        }
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, error as Web3AuthError);
    }
  }

  async connect({ chainId, getIdentityToken }: BaseConnectorLoginParams): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.metamaskSDK) throw WalletLoginError.notConnectedError("Connector is not initialized");
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    // Skip tracking for injected MetaMask since it's handled in connectTo
    // Skip tracking for rehydration since only new connections are tracked
    // Only track non-injected MetaMask when connection completes since it auto-initializes to generate QR code
    const shouldTrack = !this.isInjected && !this.rehydrated;
    const startTime = Date.now();
    const eventData = {
      connector: this.name,
      connector_type: this.type,
      is_injected: this.isInjected,
      chain_id: getCaipChainId(chainConfig),
      chain_name: chainConfig?.displayName,
      chain_namespace: chainConfig?.chainNamespace,
    };

    try {
      if (this.status !== CONNECTOR_STATUS.CONNECTING) {
        this.status = CONNECTOR_STATUS.CONNECTING;
        this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.METAMASK });
        if (!this.metamaskSDK.isExtensionActive() && this.metamaskOptions?.headless) {
          // when metamask is not injected and headless is true, broadcast the uri to the login modal
          this.metamaskSDK.getProvider().on("display_uri", (uri) => {
            this.updateConnectorData({ uri } as MetaMaskConnectorData);
          });
        }
        await this.metamaskSDK.connect();
      }

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

      // track connection events
      if (shouldTrack) {
        this.analytics?.track(ANALYTICS_EVENTS.CONNECTION_STARTED, eventData);
        this.analytics?.track(ANALYTICS_EVENTS.CONNECTION_COMPLETED, {
          ...eventData,
          duration: Date.now() - startTime,
        });
      }

      let identityTokenInfo: IdentityTokenInfo | undefined;

      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        provider: this.metamaskProvider,
        identityTokenInfo,
      } as CONNECTED_EVENT_DATA);

      if (getIdentityToken) {
        identityTokenInfo = await this.getIdentityToken();
      }

      return this.metamaskProvider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      if (!this.rehydrated) this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      this.rehydrated = false;

      // track connection events
      if (shouldTrack) {
        this.analytics?.track(ANALYTICS_EVENTS.CONNECTION_STARTED, eventData);
        this.analytics?.track(ANALYTICS_EVENTS.CONNECTION_FAILED, {
          ...eventData,
          ...getErrorAnalyticsProperties(error),
          duration: Date.now() - startTime,
        });
      }
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
    if (!this.canAuthorize) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
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
        const chainConfig = this.coreOptions.chains.find(
          (x) =>
            x.chainId === params.chainId && ([CHAIN_NAMESPACES.EIP155, CHAIN_NAMESPACES.SOLANA] as ChainNamespaceType[]).includes(x.chainNamespace)
        );
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
    await this.metamaskProvider.request<AddEthereumChainConfig[], void>({
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

export const metaMaskConnector = (params?: Partial<MetaMaskSDKOptions>): ConnectorFn => {
  return ({ coreOptions, analytics }: ConnectorParams) => {
    return new MetaMaskConnector({ connectorSettings: params, coreOptions, analytics });
  };
};
