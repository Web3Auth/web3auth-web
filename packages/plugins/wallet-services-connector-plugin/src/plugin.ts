import type { JsonRpcError } from "@metamask/rpc-errors";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CustomChainConfig, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS } from "@web3auth/base";
import { IPlugin, PLUGIN_NAMESPACES } from "@web3auth/base-plugin";
import type { Web3AuthNoModal } from "@web3auth/no-modal";
import type { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import WsEmbed, { CtorArgs, WsEmbedParams } from "@web3auth/ws-embed";
import log from "loglevel";

import { WalletServicesPluginError } from "./errors";

export class WalletServicesConnectorPlugin implements IPlugin {
  name = "WALLET_SERVICES_CONNECTOR_PLUGIN";

  readonly SUPPORTED_ADAPTERS = [WALLET_ADAPTERS.OPENLOGIN];

  readonly pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  public wsEmbedInstance: WsEmbed;

  private provider: SafeEventEmitterProvider | null = null;

  private web3auth: Web3AuthNoModal | null = null;

  private sessionId: string | null = null;

  private sessionNamespace: string | null = null;

  private userInfo: UserInfo | null = null;

  private isInitialized = false;

  private walletInitOptions: WsEmbedParams | null = null;

  constructor(options: { wsEmbedOpts: CtorArgs; walletInitOptions: Partial<WsEmbedParams> & Required<Pick<WsEmbedParams, "whiteLabel">> }) {
    const { wsEmbedOpts, walletInitOptions } = options;
    const whiteLabel = walletInitOptions?.whiteLabel;

    if (!wsEmbedOpts.web3AuthClientId) throw new Error("web3AuthClientId is required");
    if (!wsEmbedOpts.web3AuthNetwork) throw new Error("web3AuthNetwork is required");
    if (!whiteLabel) throw new Error("whiteLabel is required");
    const { logoDark, logoLight } = whiteLabel;
    if (!logoDark || !logoLight) throw new Error("logoDark and logoLight are required in whiteLabel config");
    this.wsEmbedInstance = new WsEmbed(wsEmbedOpts);
    this.walletInitOptions = walletInitOptions;
  }

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.wsEmbedInstance.provider ? (this.wsEmbedInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: Web3AuthNoModal): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw WalletServicesPluginError.web3authRequired();
    if (web3auth.provider && web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw WalletServicesPluginError.unsupportedAdapter();
    if (web3auth.coreOptions.chainConfig.chainNamespace !== this.pluginNamespace) throw WalletServicesPluginError.unsupportedChainNamespace();
    // Not connected yet to openlogin
    if (web3auth.provider) {
      this.provider = web3auth.provider;
      this.userInfo = (await web3auth.getUserInfo()) as UserInfo;
    }
    this.web3auth = web3auth;
    this.subscribeToWeb3AuthNoModalEvents(web3auth);
    const connectedChainConfig = web3auth.coreOptions.chainConfig as CustomChainConfig;
    const network = {
      blockExplorerUrl: connectedChainConfig.blockExplorer,
      logo: "",
      displayName: connectedChainConfig.displayName,
      rpcTarget: connectedChainConfig.rpcTarget,
      chainId: connectedChainConfig.chainId,
      ticker: connectedChainConfig.ticker,
      tickerName: connectedChainConfig.tickerName,
    };
    await this.wsEmbedInstance.init({
      ...(this.walletInitOptions || {}),
      chainConfig: network,
    });
    this.isInitialized = true;
  }

  async connect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth && this.web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw WalletServicesPluginError.unsupportedAdapter();
    if (!this.isInitialized) throw WalletServicesPluginError.notInitialized();
    // Not connected yet to openlogin
    if (!this.provider) {
      if (this.web3auth?.provider) {
        this.userInfo = (await this.web3auth.getUserInfo()) as UserInfo;
        this.sessionId = (this.web3auth.walletAdapters[connectedAdapterName] as OpenloginAdapter).openloginInstance.sessionId;
        this.sessionNamespace = (this.web3auth.walletAdapters[connectedAdapterName] as OpenloginAdapter).openloginInstance.sessionNamespace;
      } else if (this.web3auth) {
        throw WalletServicesPluginError.web3AuthNotConnected();
      } else {
        throw WalletServicesPluginError.providerRequired();
      }
    }
    // let privateKey: string | undefined;
    // try {
    //   // it should throw if provider doesn't support `eth_private_key` function
    //   privateKey = (await this.provider.request<never, string>({ method: "eth_private_key" })) as string;
    // } catch (error: unknown) {
    //   log.warn("unsupported method", error, WalletServicesPluginError.unsupportedAdapter());
    //   if ((error as JsonRpcError<never>)?.code === -32004) throw WalletServicesPluginError.unsupportedAdapter();
    //   throw error;
    // }
    // if (!privateKey) throw WalletServicesPluginError.web3AuthNotConnected();
    try {
      await this.wsEmbedInstance.loginWithSessionId({
        sessionId: this.sessionId,
        sessionNamespace: this.sessionNamespace,
      });
      if (this.walletInitOptions?.showTorusButton) this.wsEmbedInstance.showTorusButton();
      this.subscribeToProviderEvents(this.provider);
      this.subscribeToWalletEvents();
    } catch (error) {
      log.error(error);
    }
  }

  async showWalletConnectScanner(): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.web3AuthNotConnected();
    await this.wsEmbedInstance.showWalletConnectScanner();
  }

  async initiateTopup(provider: PAYMENT_PROVIDER_TYPE, params: PaymentParams): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.web3AuthNotConnected();
    await this.wsEmbedInstance.initiateTopup(provider, params);
  }

  async disconnect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth?.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw WalletServicesPluginError.unsupportedAdapter();
    if (this.wsEmbedInstance.isLoggedIn) {
      await this.wsEmbedInstance.logout();
    } else {
      throw new Error("Torus Wallet plugin is not connected");
    }
  }

  private subscribeToWalletEvents() {
    this.wsEmbedInstance?.provider.on("accountsChanged", (accounts = []) => {
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
      if (this.walletInitOptions?.showTorusButton) this.wsEmbedInstance.showTorusButton();
    });
  }

  private subscribeToWeb3AuthNoModalEvents(web3Auth: Web3AuthNoModal) {
    web3Auth.on(ADAPTER_EVENTS.CONNECTED, async () => {
      if (web3Auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) {
        log.warn(`${web3Auth.connectedAdapterName} is not compatible with torus wallet connector plugin`);
        return;
      }
      this.provider = web3Auth.provider;
      this.userInfo = (await web3Auth.getUserInfo()) as Omit<UserInfo, "isNewUser">;
      if (!this.provider) throw WalletServicesPluginError.web3AuthNotConnected();
      this.subscribeToProviderEvents(this.provider);
    });

    web3Auth.on(ADAPTER_EVENTS.DISCONNECTED, async () => {
      this.provider = null;
      this.userInfo = null;
      if (this.wsEmbedInstance.isLoggedIn) {
        await this.wsEmbedInstance.logout();
      }
      this.wsEmbedInstance.hideTorusButton();
    });
  }

  private async sessionConfig(): Promise<{ chainId: number; accounts: string[]; privateKey: string; chainConfig: CustomChainConfig }> {
    if (!this.provider) throw WalletServicesPluginError.web3AuthNotConnected();
    const [accounts, chainId, privateKey, chainConfig] = await Promise.all([
      this.provider.request<never, string[]>({ method: "eth_accounts" }),
      this.provider.request<never, string>({ method: "eth_chainId" }),
      this.provider.request<never, string>({ method: "eth_private_key" }),
      this.provider.request<never, CustomChainConfig>({ method: "eth_provider_config" }),
    ]);
    return {
      chainId: parseInt(chainId as string, 16),
      accounts: accounts as string[],
      privateKey: privateKey as string,
      chainConfig: chainConfig as CustomChainConfig,
    };
  }

  private async torusWalletSessionConfig(): Promise<{ chainId: number; accounts: string[] }> {
    if (!this.wsEmbedInstance.provider) throw WalletServicesPluginError.web3AuthNotConnected();
    const [accounts, chainId] = await Promise.all([
      this.wsEmbedInstance.provider.request<string[]>({ method: "eth_accounts" }),
      this.wsEmbedInstance.provider.request<string>({ method: "eth_chainId" }),
    ]);
    return {
      chainId: parseInt(chainId as string, 16),
      accounts: accounts as string[],
    };
  }

  private async setSelectedAddress(address: string): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn || !this.userInfo) throw WalletServicesPluginError.web3AuthNotConnected();
    const [sessionConfig, torusWalletSessionConfig] = await Promise.all([this.sessionConfig(), this.torusWalletSessionConfig()]);
    if (address !== torusWalletSessionConfig.accounts?.[0]) {
      await this.wsEmbedInstance.loginWithPrivateKey({
        privateKey: sessionConfig.privateKey,
        userInfo: {
          ...this.userInfo,
          email: this.userInfo?.email as string,
          name: this.userInfo?.name as string,
          profileImage: this.userInfo?.profileImage as string,
          typeOfLogin: this.userInfo?.typeOfLogin as LOGIN_TYPE, // openlogin's login type is subset of torus embed, so it is safe to cast.
        },
      });
    }
  }

  private async setChainID(chainId: number): Promise<void> {
    const [sessionConfig, torusWalletSessionConfig] = await Promise.all([this.sessionConfig(), this.torusWalletSessionConfig()]);
    const { chainConfig } = sessionConfig || {};
    if (chainId !== torusWalletSessionConfig.chainId && chainConfig) {
      await this.wsEmbedInstance.setProvider({
        ...chainConfig,
        chainId,
        host: chainConfig.rpcTarget,
        networkName: chainConfig.displayName,
      });
    }
  }
}
