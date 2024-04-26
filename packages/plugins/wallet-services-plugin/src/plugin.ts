import type { EthereumProviderConfig } from "@toruslabs/ethereum-controllers";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  CustomChainConfig,
  IPlugin,
  IWeb3Auth,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import type { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import WsEmbed, { CtorArgs, WsEmbedParams } from "@web3auth/ws-embed";
import log from "loglevel";

import { WalletServicesPluginError } from "./errors";

export class WalletServicesPlugin extends SafeEventEmitter implements IPlugin {
  name = "WALLET_SERVICES_PLUGIN";

  readonly SUPPORTED_ADAPTERS = [WALLET_ADAPTERS.OPENLOGIN];

  readonly pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  public wsEmbedInstance: WsEmbed;

  private provider: SafeEventEmitterProvider | null = null;

  private web3auth: IWeb3Auth | null = null;

  private isInitialized = false;

  private walletInitOptions: WsEmbedParams | null = null;

  constructor(
    options: { wsEmbedOpts?: Partial<CtorArgs>; walletInitOptions?: Omit<WsEmbedParams, "buildEnv" | "enableLogging" | "chainConfig"> } = {}
  ) {
    super();
    const { wsEmbedOpts, walletInitOptions } = options;
    // we fake these checks here and get them from web3auth instance
    this.wsEmbedInstance = new WsEmbed((wsEmbedOpts || {}) as CtorArgs);
    this.walletInitOptions = walletInitOptions || {};
  }

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.wsEmbedInstance.provider ? (this.wsEmbedInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: IWeb3Auth): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw WalletServicesPluginError.web3authRequired();
    if (web3auth.provider && web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw WalletServicesPluginError.unsupportedAdapter();
    if (web3auth.coreOptions.chainConfig.chainNamespace !== this.pluginNamespace) throw WalletServicesPluginError.unsupportedChainNamespace();
    // Not connected yet to openlogin
    if (web3auth.provider) {
      this.provider = web3auth.provider;
    }
    this.web3auth = web3auth;
    // get whitelabel from openlogin adapter
    const { options } = (this.web3auth.walletAdapters[this.web3auth.connectedAdapterName] as OpenloginAdapter).openloginInstance || {};
    const { logoDark, logoLight } = options.whiteLabel || {};
    if (!logoDark || !logoLight) throw new Error("logoDark and logoLight are required in whiteLabel config");

    this.wsEmbedInstance.web3AuthClientId = this.web3auth.coreOptions.clientId;
    this.wsEmbedInstance.web3AuthNetwork = this.web3auth.coreOptions.web3AuthNetwork;
    this.subscribeToWeb3AuthNoModalEvents(web3auth);
    const connectedChainConfig = web3auth.coreOptions.chainConfig as CustomChainConfig;
    if (!connectedChainConfig.blockExplorerUrl) throw WalletServicesPluginError.invalidParams("blockExplorerUrl is required in chainConfig");
    if (!connectedChainConfig.displayName) throw WalletServicesPluginError.invalidParams("displayName is required in chainConfig");
    if (!connectedChainConfig.logo) throw WalletServicesPluginError.invalidParams("logo is required in chainConfig");
    if (!connectedChainConfig.ticker) throw WalletServicesPluginError.invalidParams("ticker is required in chainConfig");
    if (!connectedChainConfig.tickerName) throw WalletServicesPluginError.invalidParams("tickerName is required in chainConfig");

    await this.wsEmbedInstance.init({
      ...this.walletInitOptions,
      chainConfig: connectedChainConfig as EthereumProviderConfig,
      buildEnv: options?.buildEnv,
      enableLogging: this.web3auth.coreOptions?.enableLogging,
      whiteLabel: {
        ...options.whiteLabel,
        ...(this.walletInitOptions.whiteLabel || {}),
      },
    });
    this.isInitialized = true;
    this.emit(PLUGIN_EVENTS.READY);
  }

  initWithProvider(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async connect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth && this.web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw WalletServicesPluginError.unsupportedAdapter();
    if (!this.isInitialized) throw WalletServicesPluginError.notInitialized();
    this.emit(PLUGIN_EVENTS.CONNECTING);

    const { connectedAdapterName } = this.web3auth;

    // Not connected yet to openlogin
    let sessionId: string | null = null;
    let sessionNamespace: string = "";
    if (this.web3auth?.provider) {
      const { openloginInstance } = this.web3auth.walletAdapters[connectedAdapterName] as OpenloginAdapter;
      sessionId = openloginInstance.sessionId;
      sessionNamespace = (this.web3auth.walletAdapters[connectedAdapterName] as OpenloginAdapter).openloginInstance.sessionNamespace;
    } else if (this.web3auth) {
      throw WalletServicesPluginError.web3AuthNotConnected();
    } else {
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
    } catch (error: unknown) {
      log.error(error);
      this.emit(PLUGIN_EVENTS.ERRORED, { error: (error as Error).message || "Something went wrong" });
    }
  }

  async showWalletConnectScanner(): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.web3AuthNotConnected();
    await this.wsEmbedInstance.showWalletConnectScanner();
  }

  async showCheckout(): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.web3AuthNotConnected();
    await this.wsEmbedInstance.showCheckout();
  }

  async showWalletUi(): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.web3AuthNotConnected();
    await this.wsEmbedInstance.showWalletUi();
  }

  async disconnect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth?.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw WalletServicesPluginError.unsupportedAdapter();
    if (this.wsEmbedInstance.isLoggedIn) {
      await this.wsEmbedInstance.logout();
      this.emit(PLUGIN_EVENTS.DISCONNECTED);
    } else {
      throw new Error("Wallet Services plugin is not connected");
    }
  }

  private subscribeToWalletEvents() {
    this.wsEmbedInstance?.provider.on("accountsChanged", (accounts: string[] = []) => {
      if ((accounts as string[]).length === 0) {
        this.wsEmbedInstance.hideTorusButton();
        if (this.web3auth?.status === ADAPTER_STATUS.CONNECTED) this.web3auth?.logout();
      }
    });
  }

  private subscribeToProviderEvents(provider: SafeEventEmitterProvider) {
    provider.on("accountsChanged", (data: { accounts: string[] } = { accounts: [] }) => {
      this.setSelectedAddress(data.accounts[0]);
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

  private subscribeToWeb3AuthNoModalEvents(web3Auth: IWeb3Auth) {
    web3Auth.on(ADAPTER_EVENTS.CONNECTED, async () => {
      if (web3Auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) {
        log.warn(`${web3Auth.connectedAdapterName} is not compatible with wallet services connector plugin`);
        return;
      }
      this.provider = web3Auth.walletAdapters[WALLET_ADAPTERS.OPENLOGIN].provider;
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
    if (!this.web3auth.connected) throw WalletServicesPluginError.web3AuthNotConnected();
    const walletServicesSessionConfig = await this.walletServicesSessionConfig();
    if (address !== walletServicesSessionConfig.accounts?.[0]) {
      const { sessionId, sessionNamespace } = (this.web3auth.walletAdapters[this.web3auth.connectedAdapterName] as OpenloginAdapter)
        .openloginInstance;
      await this.wsEmbedInstance.loginWithSessionId({
        sessionId,
        sessionNamespace,
      });
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
