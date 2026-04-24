import { createEVMClient, type Hex, type MetamaskConnectEVM } from "@metamask/connect-evm";
import { createMultichainClient, hasExtension, type MultichainCore, type Scope } from "@metamask/connect-multichain";
import { createSolanaClient, type SolanaClient } from "@metamask/connect-solana";
import { getErrorAnalyticsProperties, signChallenge } from "@toruslabs/base-controllers";
import type { Wallet } from "@wallet-standard/base";
import { StandardConnect, StandardConnectFeature } from "@wallet-standard/features";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";

import {
  type Analytics,
  ANALYTICS_EVENTS,
  type AuthTokenInfo,
  BaseConnector,
  BaseConnectorLoginParams,
  type BaseConnectorSettings,
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  citadelServerUrl,
  CONNECTED_EVENT_DATA,
  type Connection,
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
  getSolanaChainByChainConfig,
  type IProvider,
  type UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletLoginError,
  walletSignMessage,
  Web3AuthError,
} from "../../base";
import { getSiteName } from "../utils";

/**
 * Configuration options for the MetaMask connector using \@metamask/connect-evm
 */
export interface MetaMaskConnectorSettings {
  /** Dapp identification and branding settings */
  dapp?: {
    name?: string;
    url?: string;
    iconUrl?: string;
  };
  /** Enable debug logging for the MetaMask SDK */
  debug?: boolean;
  /** UI settings for the MetaMask connector */
  ui?: {
    preferExtension?: boolean;
    showInstallModal?: boolean;
    headless?: boolean;
  };
}

export interface MetaMaskConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: MetaMaskConnectorSettings;
}

class MetaMaskConnector extends BaseConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.MULTICHAIN;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.OTHER;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.METAMASK;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private evmClient: MetamaskConnectEVM | null = null;

  private evmProvider: IProvider | null = null;

  private solanaClient: SolanaClient | null = null;

  private solanaProvider: Wallet | null = null;

  private initializationPromise: Promise<void> | null = null;

  private multichainClient: MultichainCore | null = null;

  private connectorSettings?: MetaMaskConnectorSettings;

  private analytics?: Analytics;

  constructor(connectorOptions: MetaMaskConnectorOptions) {
    super(connectorOptions);
    this.connectorSettings = connectorOptions.connectorSettings;
    this.analytics = connectorOptions.analytics;
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.evmProvider) {
      return this.evmProvider as unknown as IProvider;
    }
    return null;
  }

  get solanaWallet(): Wallet | null {
    return this.solanaProvider;
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });

    // Build supported networks in CAIP-2 format for multichain client
    const caipSupportedNetworks: Record<string, string> = {};
    for (const chain of this.coreOptions.chains) {
      caipSupportedNetworks[getCaipChainId(chain)] = chain.rpcTarget;
    }

    // Build supported networks in hex format for EVM client
    const hexSupportedNetworks: Record<string, string> = {};
    for (const chain of this.coreOptions.chains) {
      if (chain.chainNamespace === CHAIN_NAMESPACES.EIP155) {
        hexSupportedNetworks[chain.chainId] = chain.rpcTarget;
      }
    }

    // Build supported networks for Solana client (MetaMask expects mainnet | testnet | devnet keys)
    const solanaSupportedNetworks: Record<string, string> = {};
    for (const chain of this.coreOptions.chains) {
      if (chain.chainNamespace !== CHAIN_NAMESPACES.SOLANA) continue;
      const solanaChainId = getSolanaChainByChainConfig(chain);
      if (!solanaChainId) continue;
      const networkName = solanaChainId.split(":")[1];
      if (networkName) solanaSupportedNetworks[networkName] = chain.rpcTarget;
    }

    // Detect app metadata
    const appName = getSiteName(window) || this.connectorSettings?.dapp?.name || "web3auth";
    const appUrl = this.connectorSettings?.dapp?.url || window.location.origin || "https://web3auth.io";
    const appIconUrl = this.connectorSettings?.dapp?.iconUrl;

    const dapp = {
      name: appName,
      url: appUrl,
      ...(appIconUrl && { iconUrl: appIconUrl }),
    };
    const ui = {
      preferExtension: this.connectorSettings?.ui?.preferExtension ?? true,
      showInstallModal: this.connectorSettings?.ui?.showInstallModal ?? false,
      headless: this.connectorSettings?.ui?.headless ?? true,
    };

    let initResolve: () => void;
    let initReject: (reason?: Error) => void;
    this.initializationPromise = new Promise((resolve, reject) => {
      initResolve = resolve;
      initReject = reject;
    });

    const hasEvmChains = Object.keys(hexSupportedNetworks).length > 0;
    const hasSolanaChains = Object.keys(solanaSupportedNetworks).length > 0;

    try {
      // Initialize the multichain client (singleton) first
      this.multichainClient = await createMultichainClient({
        dapp,
        api: { supportedNetworks: caipSupportedNetworks },
        ui,
        debug: this.connectorSettings?.debug,
      });

      // Listen for QR code URI from the multichain client (for mobile wallet connection)
      this.multichainClient.on("display_uri", (uri: string) => {
        if (uri) {
          this.updateConnectorData({ uri });
        }
      });

      // Create the EVM client only when EVM chains are configured
      // (createEVMClient requires at least one entry in supportedNetworks)
      if (hasEvmChains) {
        this.evmClient = await createEVMClient({
          dapp,
          eventHandlers: {
            accountsChanged: this.handleAccountsChanged,
            chainChanged: this.handleChainChanged,
            connect: this.handleConnect,
            disconnect: this.handleDisconnect,
          },
          api: { supportedNetworks: hexSupportedNetworks },
          ui,
          debug: this.connectorSettings?.debug,
        });

        this.evmProvider = this.evmClient.getProvider() as unknown as IProvider;
      }

      // Create the Solana client only when Solana chains are configured
      if (hasSolanaChains) {
        this.solanaClient = await createSolanaClient({
          dapp,
          api: { supportedNetworks: solanaSupportedNetworks },
          skipAutoRegister: true,
        });
        this.solanaProvider = this.solanaClient.getWallet();
      }

      this.isInjected = await hasExtension();

      initResolve();
    } catch (error) {
      initReject(WalletLoginError.connectionError("Failed to initialize MetaMask Connect SDK", error));
    }

    if (!this.multichainClient) {
      this.status = CONNECTOR_STATUS.ERRORED;
      this.emit(CONNECTOR_EVENTS.ERRORED, new Error("Failed to initialize MetaMask Connect.") as Web3AuthError);
      return;
    }

    const coreStatus = this.multichainClient.status;
    if (coreStatus === "connected") {
      this.status = CONNECTOR_STATUS.CONNECTED;

      this.rehydrated = true;

      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connectorName: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        ethereumProvider: this.evmProvider,
        solanaWallet: this.solanaProvider,
      } as CONNECTED_EVENT_DATA);

      if (options.getAuthTokenInfo) {
        await this.getAuthTokenInfo();
      }
    } else if (coreStatus === "loaded" || coreStatus === "disconnected") {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
    } else if (coreStatus === "pending") {
      // 'pending' implies that a transport failed to resume the connection
      // if (options.autoConnect) {
      //   this.rehydrated = false;
      //   this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, new Error("Failed to resume existing MetaMask Connect session.") as Web3AuthError);
      // } else {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
      // }
    } else {
      // Something unexpected happened
      this.status = CONNECTOR_STATUS.ERRORED;
      this.emit(CONNECTOR_EVENTS.ERRORED, new Error("Failed to initialize MetaMask Connect.") as Web3AuthError);
    }
  }

  async connect({ chainId, getAuthTokenInfo }: BaseConnectorLoginParams): Promise<Connection | null> {
    super.checkConnectionRequirements();

    await this.ensureInitialized();

    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    const scopes = this.coreOptions.chains.map((c) => getCaipChainId(c) as Scope);

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

        const evmConnectedPromise = new Promise<void>((resolve) => {
          // Wait for EVM provider to be ready
          this.evmProvider?.once("connect", () => {
            resolve();
          });
        });

        // Connect using the multichain client
        await this.multichainClient.connect(scopes, [], {
          solana_accountChanged_notifications: true,
        });

        // Solana wallet-standard: `standard:events` change is not emitted from multichain
        // connect alone — MetamaskWallet syncs accounts via `standard:connect` → updateSession.
        if (this.solanaProvider) {
          await (this.solanaProvider.features as StandardConnectFeature)[StandardConnect].connect();
        }

        // Wait for EVM provider to be ready
        if (this.evmProvider) {
          await evmConnectedPromise;
        }
      }

      // // Switch EVM chain if not connected to the right one (Solana chains are handled by the wallet-standard provider)
      // if (chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      //   const currentChainId = this.evmClient!.getChainId();
      //   if (currentChainId !== chainId) {
      //     await this.switchChain(chainConfig, true);
      //   }
      // }

      this.status = CONNECTOR_STATUS.CONNECTED;

      // Track connection events
      if (shouldTrack) {
        this.analytics?.track(ANALYTICS_EVENTS.CONNECTION_STARTED, eventData);
        this.analytics?.track(ANALYTICS_EVENTS.CONNECTION_COMPLETED, {
          ...eventData,
          duration: Date.now() - startTime,
        });
      }

      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connectorName: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        ethereumProvider: this.evmProvider,
        solanaWallet: this.solanaProvider,
      } as CONNECTED_EVENT_DATA);

      if (getAuthTokenInfo) {
        await this.getAuthTokenInfo();
      }

      return { ethereumProvider: this.evmProvider, solanaWallet: this.solanaProvider, connectorName: this.name };
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
    if (!this.multichainClient) throw WalletLoginError.connectionError("Multichain client is not available");
    this.checkDisconnectionRequirements();
    await this.clearWalletSession();

    // Disconnect using the multichain client
    await this.multichainClient.disconnect();

    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.initializationPromise = null;
      this.multichainClient = null;
      this.evmClient = null;
      this.evmProvider = null;
      this.solanaClient = null;
      this.solanaProvider = null;
    } else {
      // Ready to be connected again
      this.status = CONNECTOR_STATUS.READY;
    }
    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }

  async getAuthTokenInfo(): Promise<AuthTokenInfo> {
    if (!this.canAuthorize) throw WalletLoginError.notConnectedError();

    // Determine the active chain: prefer Solana if no EVM provider, otherwise use EVM provider's chain
    const evmChainId = this.evmProvider?.chainId || this.coreOptions.chains.find((x) => x.chainNamespace === CHAIN_NAMESPACES.EIP155)?.chainId;
    const isSolanaOnly = !this.evmProvider && !!this.solanaProvider;
    const activeChainConfig = isSolanaOnly
      ? this.coreOptions.chains.find((x) => x.chainNamespace === CHAIN_NAMESPACES.SOLANA)
      : this.evmProvider
        ? this.coreOptions.chains.find((x) => x.chainId === evmChainId)
        : undefined;

    if (!activeChainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: WALLET_CONNECTORS.METAMASK });

    const { chainNamespace } = activeChainConfig;
    const accounts =
      chainNamespace === CHAIN_NAMESPACES.SOLANA && this.solanaProvider
        ? this.solanaProvider.accounts.map((a) => a.address)
        : this.evmProvider
          ? await this.evmProvider.request<never, string[]>({ method: EVM_METHOD_TYPES.GET_ACCOUNTS })
          : [];

    if (accounts && accounts.length > 0) {
      const cached = await this.getCachedOrNullAuthTokenInfo(accounts[0] as string);
      if (cached) return cached;

      const authServer = citadelServerUrl(this.coreOptions.authBuildEnv);
      const payload = {
        domain: window.location.origin,
        uri: window.location.href,
        address: accounts[0],
        chainId: parseInt(activeChainConfig.chainId, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace, authServer);

      let signedMessage: string;
      if (chainNamespace === CHAIN_NAMESPACES.SOLANA && this.solanaProvider) {
        signedMessage = await walletSignMessage(this.solanaProvider, challenge, accounts[0]);
      } else if (this.evmProvider) {
        const hexChallenge = `0x${Buffer.from(challenge, "utf8").toString("hex")}`;
        signedMessage = await this.evmProvider.request<[string, string], string>({
          method: EVM_METHOD_TYPES.PERSONAL_SIGN,
          params: [hexChallenge, accounts[0]],
        });
      } else {
        throw WalletLoginError.notConnectedError("No provider available for signing");
      }

      return this.verifyAndAuthorize({ chainNamespace, signedMessage, challenge, authServer });
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.canAuthorize) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);

    const targetChainConfig = this.coreOptions.chains.find((c) => c.chainId === params.chainId);
    if (targetChainConfig?.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      // no need to switch chain for Solana
      return;
    }

    await this.ensureInitialized();

    if (!this.evmClient) {
      throw WalletLoginError.unsupportedOperation("switchChain requires an EVM client, but no EVM chains are configured.");
    }

    const chainConfig = this.coreOptions.chains.find(
      (x) => x.chainId === params.chainId && ([CHAIN_NAMESPACES.EIP155] as ChainNamespaceType[]).includes(x.chainNamespace)
    );

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

    await this.evmClient.switchChain({ chainId: params.chainId as Hex, chainConfiguration });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  /**
   * Ensures the connector is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      throw WalletLoginError.notConnectedError("Connector is not initialized. Call init() first.");
    }
    await this.initializationPromise;
  }

  /**
   * Handles accounts changed events from the MetaMask provider
   */
  private handleAccountsChanged = (_accounts: string[]): void => {
    // if (accounts.length === 0) {
    //   this.disconnect().catch(() => {
    //     // Ignore disconnect errors during account change
    //   });
    // }
  };

  /**
   * Handles disconnect events from the MetaMask provider
   */
  private handleDisconnect = (): void => {
    // this.disconnect().catch(() => {
    //   // Ignore disconnect errors
    // });
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
