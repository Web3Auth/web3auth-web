import { createEVMClient, type MetamaskConnectEVM } from "@metamask/connect-evm";
import { getErrorAnalyticsProperties } from "@toruslabs/base-controllers";

import {
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
  getCaipChainId,
  IdentityTokenInfo,
  type IProvider,
  type UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "../../base";
import { BaseEvmConnector } from "../base-evm-connector";
import { getSiteName } from "../utils";

/**
 * Configuration options for the MetaMask connector using @metamask/connect-evm
 */
export interface MetaMaskConnectorSettings {
  /** Dapp identification and branding settings */
  dapp?: {
    name?: string;
    url?: string;
  };
  /** Enable debug logging for the MetaMask SDK */
  debug?: boolean;
}

export interface MetaMaskConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: MetaMaskConnectorSettings;
}

class MetaMaskConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.METAMASK;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private metamaskProvider: IProvider | null = null;

  private metamaskInstance: MetamaskConnectEVM | null = null;

  private metamaskPromise: Promise<MetamaskConnectEVM> | undefined;

  private connectorSettings?: MetaMaskConnectorSettings;

  private analytics?: Analytics;

  constructor(connectorOptions: MetaMaskConnectorOptions) {
    super(connectorOptions);
    this.connectorSettings = connectorOptions.connectorSettings;
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

  /**
   * Ensures the MetaMask Connect EVM instance is initialized
   */
  private async ensureMetamask(): Promise<MetamaskConnectEVM> {
    if (!this.metamaskInstance) {
      if (!this.metamaskPromise) {
        throw WalletLoginError.notConnectedError("Connector is not initialized. Call init() first.");
      }
      this.metamaskInstance = await this.metamaskPromise;
    }
    return this.metamaskInstance;
  }

  /**
   * Handles accounts changed events from the MetaMask provider
   */
  private handleAccountsChanged = (accounts: string[]): void => {
    if (accounts.length === 0) {
      this.disconnect().catch(() => {
        // Ignore disconnect errors during account change
      });
    }
  };

  /**
   * Handles disconnect events from the MetaMask provider
   */
  private handleDisconnect = (): void => {
    this.disconnect().catch(() => {
      // Ignore disconnect errors
    });
  };

  /**
   * Handles chain changed events from the MetaMask provider
   */
  private handleChainChanged = (_chainId: string): void => {
    // Chain change is handled internally by the provider
  };

  /**
   * Handles connect events from the MetaMask provider
   */
  private handleConnect = (_result: { chainId: string; accounts: string[] }): void => {
    // Connect is handled internally
  };

  async init(options: ConnectorInitOptions): Promise<void> {
    await super.init(options);
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });

    // Build supported networks in CAIP-2 format (eip155:chainId -> rpcUrl)
    const supportedNetworks: Record<string, string> = {};
    for (const chain of this.coreOptions.chains) {
      // Convert hex chainId (0x1) to number for CAIP-2 format (eip155:1)
      const numericChainId = parseInt(chain.chainId, 16);
      const caipChainId = `eip155:${numericChainId}`;
      supportedNetworks[caipChainId] = chain.rpcTarget;
    }

    // Detect app metadata
    const appName = getSiteName(window) || this.connectorSettings?.dapp?.name || "web3auth";
    const appUrl = this.connectorSettings?.dapp?.url || window.location.origin || "https://web3auth.io";

    // Initialize the MetaMask Connect EVM SDK
    this.metamaskPromise = createEVMClient({
      dapp: {
        name: appName,
        url: appUrl,
      },
      eventHandlers: {
        accountsChanged: this.handleAccountsChanged,
        chainChanged: this.handleChainChanged,
        connect: this.handleConnect,
        disconnect: this.handleDisconnect,
      },
      api: {
        supportedNetworks: {
          // Fallback public RPC endpoints if no Infura key is provided
          // "eip155:1": "https://eth.llamarpc.com",
          "eip155:1": "https://mainnet.infura.io/v3/de3198afe5f44ee99d155c9843001539",
          "eip155:5": "https://goerli.infura.io/v3/demo",
          "eip155:11155111": "https://sepolia.infura.io/v3/demo",
          "eip155:137": "https://polygon-rpc.com",
        },
      },
      debug: this.connectorSettings?.debug,
    });

    try {
      this.metamaskInstance = await this.metamaskPromise;
    } catch (error) {
      throw WalletLoginError.connectionError("Failed to initialize MetaMask Connect SDK", error);
    }

    // TODO need to figure this out
    this.isInjected = false;

    if (this.metamaskInstance.status === "connected") {
      this.status = CONNECTOR_STATUS.CONNECTED;
      let identityTokenInfo: IdentityTokenInfo | undefined;

      if (options.getIdentityToken) {
        identityTokenInfo = await this.getIdentityToken();
      }
      this.rehydrated = true;

      const provider = this.metamaskInstance.getProvider() as unknown as IProvider;
      if (!provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");

      this.metamaskProvider = provider;

      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        provider: this.metamaskProvider,
        identityTokenInfo,
      } as CONNECTED_EVENT_DATA);
    } else if (this.metamaskInstance.status === "loaded") {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
    } else if (this.metamaskInstance.status === "pending") {
      // 'pending' implies that a transport failed to resume the connection
      // if (options.autoConnect) {
      //   this.rehydrated = false;
      //   this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, new Error("Failed to resume existing MetaMask Connect session.") as Web3AuthError);
      // } else {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
      // }
    } else {
      // 'connecting' is not a possible state at this point
      // 'disconnected' is not a possible state at this point
      // Something unexpected happened
      this.status = CONNECTOR_STATUS.ERRORED;
      this.emit(CONNECTOR_EVENTS.ERRORED, new Error("Failed to initialize MetaMask Connect.") as Web3AuthError);
    }
  }

  async connect({ chainId, getIdentityToken }: BaseConnectorLoginParams): Promise<IProvider | null> {
    super.checkConnectionRequirements();

    const instance = await this.ensureMetamask();

    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    // Convert hex chainIds to numeric for the new SDK
    const chainIds = this.coreOptions.chains.map((c) => parseInt(c.chainId, 16));
    const targetChainId = parseInt(chainId, 16);

    // Skip tracking for rehydration since only new connections are tracked
    const shouldTrack = !this.rehydrated;
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

        // Connect using the new SDK
        await instance.connect({
          account: undefined,
          chainIds,
        });
      }

      // Get the provider from the SDK
      const provider = instance.getProvider() as unknown as IProvider;
      if (!provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");

      this.metamaskProvider = provider;

      // Switch chain if not connected to the right chain
      const currentChainId = instance.getChainId();
      const currentChainIdNumeric = currentChainId ? parseInt(currentChainId, 16) : undefined;

      if (currentChainIdNumeric !== targetChainId) {
        await this.switchChain(chainConfig, true);
      }

      this.status = CONNECTOR_STATUS.CONNECTED;

      // Track connection events
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
      // Ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      if (!this.rehydrated) this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      this.rehydrated = false;

      // Track connection events
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
    if (!this.metamaskInstance) throw WalletLoginError.connectionError("MetaMask instance is not available");
    await super.disconnectSession();

    // Disconnect using the new SDK
    await this.metamaskInstance.disconnect();

    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.metamaskProvider = null;
      this.metamaskInstance = null;
      this.metamaskPromise = undefined;
    } else {
      // Ready to be connected again
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

    const instance = await this.ensureMetamask();

    const chainConfig = this.coreOptions.chains.find(
      (x) => x.chainId === params.chainId && ([CHAIN_NAMESPACES.EIP155] as ChainNamespaceType[]).includes(x.chainNamespace)
    );

    const chainId = parseInt(params.chainId, 16);

    // Build chain configuration for the new SDK
    // The new SDK handles adding the chain automatically if needed
    const chainConfiguration = chainConfig
      ? {
          chainId: params.chainId,
          chainName: chainConfig.displayName,
          rpcUrls: [chainConfig.rpcTarget],
          blockExplorerUrls: chainConfig.blockExplorerUrl ? [chainConfig.blockExplorerUrl] : undefined,
          nativeCurrency: {
            name: chainConfig.tickerName,
            symbol: chainConfig.ticker,
            decimals: chainConfig.decimals || 18,
          },
          iconUrls: chainConfig.logo ? [chainConfig.logo] : undefined,
        }
      : undefined;

    // The new SDK's switchChain handles both switching and adding chains automatically
    await instance.switchChain({ chainId, chainConfiguration });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

/**
 * Factory function to create a MetaMask connector
 *
 * @param params - Configuration options for the MetaMask SDK
 * @returns A connector function that creates a MetaMaskConnector instance
 *
 * @example
 * ```typescript
 * const connector = metaMaskConnector({
 *   dapp: { name: 'My DApp', url: 'https://mydapp.com' },
 *   debug: true,
 * });
 * ```
 */
export const metaMaskConnector = (params?: MetaMaskConnectorSettings): ConnectorFn => {
  return ({ coreOptions, analytics }: ConnectorParams) => {
    return new MetaMaskConnector({ connectorSettings: params, coreOptions, analytics });
  };
};
