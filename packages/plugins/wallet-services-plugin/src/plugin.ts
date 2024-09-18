import { type BaseEmbedControllerState } from "@toruslabs/base-controllers";
import type { EthereumProviderConfig } from "@toruslabs/ethereum-controllers";
import { SafeEventEmitter, type WhiteLabelData } from "@web3auth/auth";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  EVM_PLUGINS,
  IPlugin,
  IProvider,
  IWeb3AuthCore,
  log,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  PLUGIN_STATUS,
  PLUGIN_STATUS_TYPE,
  PluginConnectParams,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
  WalletServicesPluginError,
} from "@web3auth/base";
import WsEmbed, { CtorArgs, WsEmbedParams } from "@web3auth/ws-embed";

type WsPluginEmbedParams = Omit<WsEmbedParams, "buildEnv" | "enableLogging" | "chainConfig" | "confirmationStrategy"> & {
  /**
   * Determines how to show confirmation screens
   * @defaultValue default
   *
   * default & auto-approve
   * - use auto-approve as default
   * - if wallet connect request use modal
   *
   * modal
   * - use modal always
   */
  confirmationStrategy?: Exclude<WsEmbedParams["confirmationStrategy"], "popup">;
};

export class WalletServicesPlugin extends SafeEventEmitter implements IPlugin {
  name = EVM_PLUGINS.WALLET_SERVICES;

  public status: PLUGIN_STATUS_TYPE = PLUGIN_STATUS.DISCONNECTED;

  readonly SUPPORTED_ADAPTERS = [WALLET_ADAPTERS.AUTH, WALLET_ADAPTERS.SFA];

  readonly pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  public wsEmbedInstance: WsEmbed;

  private provider: IProvider | null = null;

  private web3auth: IWeb3AuthCore | null = null;

  private isInitialized = false;

  private walletInitOptions: WsPluginEmbedParams | null = null;

  constructor(options: { wsEmbedOpts?: Partial<CtorArgs>; walletInitOptions?: WsPluginEmbedParams } = {}) {
    super();
    const { wsEmbedOpts, walletInitOptions } = options;
    // we fake these checks here and get them from web3auth instance
    this.wsEmbedInstance = new WsEmbed((wsEmbedOpts || {}) as CtorArgs);
    this.walletInitOptions = walletInitOptions || {};
  }

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.wsEmbedInstance.provider ? (this.wsEmbedInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: IWeb3AuthCore, whiteLabel?: WhiteLabelData): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw WalletServicesPluginError.web3authRequired();
    if (web3auth.provider && !this.SUPPORTED_ADAPTERS.includes(web3auth.connectedAdapterName)) throw WalletServicesPluginError.notInitialized();
    if (web3auth.coreOptions.chainConfig.chainNamespace !== this.pluginNamespace) throw WalletServicesPluginError.unsupportedChainNamespace();
    // Not connected yet to auth
    if (web3auth.provider) {
      this.provider = web3auth.provider;
    }
    this.web3auth = web3auth;
    const mergedWhitelabelSettings = {
      ...whiteLabel,
      ...(this.walletInitOptions.whiteLabel || {}),
    };

    const { logoDark, logoLight } = mergedWhitelabelSettings || {};
    if (!logoDark || !logoLight) throw WalletServicesPluginError.invalidParams("logoDark and logoLight are required in whiteLabel config");

    this.wsEmbedInstance.web3AuthClientId = this.web3auth.coreOptions.clientId;
    this.wsEmbedInstance.web3AuthNetwork = this.web3auth.coreOptions.web3AuthNetwork;
    this.subscribeToWeb3AuthEvents(web3auth);
    const connectedChainConfig = web3auth.coreOptions.chainConfig as CustomChainConfig;
    if (!connectedChainConfig.blockExplorerUrl) throw WalletServicesPluginError.invalidParams("blockExplorerUrl is required in chainConfig");
    if (!connectedChainConfig.displayName) throw WalletServicesPluginError.invalidParams("displayName is required in chainConfig");
    if (!connectedChainConfig.logo) throw WalletServicesPluginError.invalidParams("logo is required in chainConfig");
    if (!connectedChainConfig.ticker) throw WalletServicesPluginError.invalidParams("ticker is required in chainConfig");
    if (!connectedChainConfig.tickerName) throw WalletServicesPluginError.invalidParams("tickerName is required in chainConfig");

    const finalInitOptions = {
      ...this.walletInitOptions,
      chainConfig: connectedChainConfig as EthereumProviderConfig,
      enableLogging: this.web3auth.coreOptions?.enableLogging,
      whiteLabel: mergedWhitelabelSettings,
    };

    await this.wsEmbedInstance.init(finalInitOptions);
    this.isInitialized = true;
    this.status = PLUGIN_STATUS.READY;
    this.emit(PLUGIN_EVENTS.READY);
  }

  initWithProvider(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async connect({ sessionId, sessionNamespace }: PluginConnectParams): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (!this.isInitialized) throw WalletServicesPluginError.notInitialized();
    this.emit(PLUGIN_EVENTS.CONNECTING);
    this.status = PLUGIN_STATUS.CONNECTING;

    if (!this.provider) {
      if (this.web3auth?.provider) {
        this.provider = this.web3auth.provider;
      }
    }

    if (this.web3auth.status !== ADAPTER_STATUS.CONNECTED) {
      throw WalletServicesPluginError.web3AuthNotConnected();
    } else if (!this.web3auth.provider) {
      throw WalletServicesPluginError.providerRequired();
    }

    if (!sessionId) {
      throw WalletServicesPluginError.web3AuthNotConnected();
    }

    try {
      await this.wsEmbedInstance.loginWithSessionId({
        sessionId,
        sessionNamespace,
      });
      if (this.walletInitOptions?.whiteLabel?.showWidgetButton) this.wsEmbedInstance.showTorusButton();
      this.subscribeToProviderEvents(this.provider);
      this.subscribeToWalletEvents();
      this.emit(PLUGIN_EVENTS.CONNECTED);
      this.status = PLUGIN_STATUS.CONNECTED;
    } catch (error: unknown) {
      log.error(error);
      this.status = PLUGIN_STATUS.ERRORED;
      this.emit(PLUGIN_EVENTS.ERRORED, { error: (error as Error).message || "Something went wrong" });
    }
  }

  async showWalletConnectScanner(showWalletConnectParams?: BaseEmbedControllerState["showWalletConnect"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showWalletConnectScanner(showWalletConnectParams);
  }

  async showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showCheckout(showCheckoutParams);
  }

  async showWalletUi(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showWalletUi(showWalletUiParams);
  }

  async cleanup(): Promise<void> {
    return this.wsEmbedInstance.cleanUp();
  }

  async disconnect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.wsEmbedInstance.isLoggedIn) {
      await this.wsEmbedInstance.logout();
      this.emit(PLUGIN_EVENTS.DISCONNECTED);
      this.status = PLUGIN_STATUS.DISCONNECTED;
    } else {
      throw WalletServicesPluginError.invalidSession("Wallet Services plugin is not connected");
    }
  }

  private subscribeToWalletEvents() {
    this.wsEmbedInstance?.provider.on("accountsChanged", (accounts: unknown[] = []) => {
      if ((accounts as string[]).length === 0) {
        this.wsEmbedInstance.hideTorusButton();
        if (this.web3auth?.status === ADAPTER_STATUS.CONNECTED) this.web3auth?.logout();
      }
    });
  }

  private subscribeToProviderEvents(provider: IProvider) {
    provider.on("accountsChanged", (accounts: string[] = []) => {
      this.setSelectedAddress(accounts[0]);
    });

    provider.on("chainChanged", (chainId: string) => {
      this.setChainID(parseInt(chainId, 16));
    });
    provider.on("disconnect", () => {
      this.wsEmbedInstance.hideTorusButton();
    });
    provider.on("connect", () => {
      if (this.walletInitOptions?.whiteLabel?.showWidgetButton) this.wsEmbedInstance.showTorusButton();
    });
  }

  private subscribeToWeb3AuthEvents(web3Auth: IWeb3AuthCore) {
    web3Auth.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
      this.provider = data.provider || web3Auth.provider;
      if (!this.provider) throw WalletServicesPluginError.web3AuthNotConnected();
      this.subscribeToProviderEvents(this.provider);
    });

    web3Auth.on(ADAPTER_EVENTS.DISCONNECTED, async () => {
      this.provider = null;
      if (this.wsEmbedInstance.isLoggedIn) {
        await this.wsEmbedInstance.logout();
      }
      this.wsEmbedInstance.hideTorusButton();
    });
  }

  private async sessionConfig(): Promise<{ chainId: number; accounts: string[]; chainConfig: CustomChainConfig }> {
    if (!this.provider) throw WalletServicesPluginError.web3AuthNotConnected();
    const [accounts, chainId, chainConfig] = await Promise.all([
      this.provider.request<never, string[]>({ method: "eth_accounts" }),
      this.provider.request<never, string>({ method: "eth_chainId" }),
      this.provider.request<never, CustomChainConfig>({ method: "eth_provider_config" }),
    ]);
    return {
      chainId: parseInt(chainId as string, 16),
      accounts: accounts as string[],
      chainConfig: chainConfig as CustomChainConfig,
    };
  }

  private async walletServicesSessionConfig(): Promise<{ chainId: number; accounts: string[] }> {
    if (!this.wsEmbedInstance.provider) throw WalletServicesPluginError.web3AuthNotConnected();
    const [accounts, chainId] = await Promise.all([
      this.wsEmbedInstance.provider.request<[], string[]>({ method: "eth_accounts" }),
      this.wsEmbedInstance.provider.request<[], string>({ method: "eth_chainId" }),
    ]);
    return {
      chainId: parseInt(chainId as string, 16),
      accounts: accounts as string[],
    };
  }

  private async setSelectedAddress(address: string): Promise<void> {
    if (this.web3auth.status !== ADAPTER_STATUS.CONNECTED) throw WalletServicesPluginError.web3AuthNotConnected();
    const walletServicesSessionConfig = await this.walletServicesSessionConfig();
    if (address !== walletServicesSessionConfig.accounts?.[0]) {
      throw WalletServicesPluginError.invalidSession();
    }
  }

  private async setChainID(chainId: number): Promise<void> {
    const [sessionConfig, walletServicesSessionConfig] = await Promise.all([this.sessionConfig(), this.walletServicesSessionConfig()]);
    const { chainConfig } = sessionConfig || {};
    if (!chainConfig.blockExplorerUrl) throw WalletServicesPluginError.invalidParams("blockExplorerUrl is required in chainConfig");
    if (!chainConfig.displayName) throw WalletServicesPluginError.invalidParams("displayName is required in chainConfig");
    if (!chainConfig.logo) throw WalletServicesPluginError.invalidParams("logo is required in chainConfig");
    if (!chainConfig.ticker) throw WalletServicesPluginError.invalidParams("ticker is required in chainConfig");
    if (!chainConfig.tickerName) throw WalletServicesPluginError.invalidParams("tickerName is required in chainConfig");

    if (chainId !== walletServicesSessionConfig.chainId && chainConfig) {
      try {
        await this.wsEmbedInstance.provider
          ?.request({
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
          })
          .catch(() => {
            // TODO: throw more specific error from the controller
            log.error("WalletServicesPlugin: Error adding chain");
          });

        await this.wsEmbedInstance.provider?.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainConfig.chainId }],
        });
      } catch (error) {
        // TODO: throw more specific error from the controller
        log.error("WalletServicesPlugin: Error switching chain");
      }
    }
  }
}
