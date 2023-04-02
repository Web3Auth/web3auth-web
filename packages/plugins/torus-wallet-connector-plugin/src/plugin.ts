import TorusEmbed, { LOGIN_TYPE, PAYMENT_PROVIDER_TYPE, PaymentParams, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CustomChainConfig, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS } from "@web3auth/base";
import { IPlugin, PLUGIN_NAMESPACES } from "@web3auth/base-plugin";
import type { Web3AuthNoModal } from "@web3auth/no-modal";
import type { EthereumRpcError } from "eth-rpc-errors";
import log from "loglevel";

import { TorusWalletPluginError } from "./errors";

export type ProviderInfo = {
  provider?: SafeEventEmitterProvider;
  userInfo?: Omit<UserInfo, "isNewUser">;
};

export class TorusWalletConnectorPlugin implements IPlugin {
  name = "TORUS_WALLET_CONNECTOR_PLUGIN";

  readonly SUPPORTED_ADAPTERS = [WALLET_ADAPTERS.OPENLOGIN];

  readonly pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  public torusWalletInstance: TorusEmbed;

  private provider: SafeEventEmitterProvider | null = null;

  private web3auth: Web3AuthNoModal | null = null;

  private userInfo: UserInfo | null = null;

  private isInitialized = false;

  private walletInitOptions: TorusParams | null = null;

  constructor(options: { torusWalletOpts?: TorusCtorArgs; walletInitOptions: Partial<TorusParams> & Required<Pick<TorusParams, "whiteLabel">> }) {
    const { torusWalletOpts = {}, walletInitOptions } = options;
    const whiteLabel = walletInitOptions?.whiteLabel;

    if (!whiteLabel) throw new Error("whiteLabel is required");
    const { logoDark, logoLight } = whiteLabel;
    if (!logoDark || !logoLight) throw new Error("logoDark and logoLight are required in whiteLabel config");

    this.torusWalletInstance = new TorusEmbed(torusWalletOpts);
    this.walletInitOptions = walletInitOptions;
  }

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.torusWalletInstance.isLoggedIn ? (this.torusWalletInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: Web3AuthNoModal): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw TorusWalletPluginError.web3authRequired();
    if (web3auth.provider && web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw TorusWalletPluginError.unsupportedAdapter();
    // Not connected yet to openlogin
    if (web3auth.provider) {
      this.provider = web3auth.provider;
      this.userInfo = (await web3auth.getUserInfo()) as UserInfo;
    }
    this.web3auth = web3auth;
    this.subscribeToWeb3AuthNoModalEvents(web3auth);
    const connectedChainConfig = web3auth.coreOptions.chainConfig as CustomChainConfig;
    const network = {
      ...web3auth.coreOptions.chainConfig,
      networkName: connectedChainConfig.displayName,
      host: connectedChainConfig.rpcTarget,
      chainId: parseInt(connectedChainConfig.chainId, 16),
    };
    await this.torusWalletInstance.init({
      ...(this.walletInitOptions || {}),
      network,
      showTorusButton: false,
    });
    this.isInitialized = true;
  }

  async initWithProvider(provider: SafeEventEmitterProvider, userInfo: UserInfo): Promise<void> {
    if (this.isInitialized) return;

    if (!userInfo) throw TorusWalletPluginError.userInfoRequired();
    if (!provider) throw TorusWalletPluginError.providerRequired();

    this.provider = provider;
    this.userInfo = userInfo;
    await this.torusWalletInstance.init(this.walletInitOptions || {});
    this.isInitialized = true;
  }

  async connect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth && this.web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw TorusWalletPluginError.unsupportedAdapter();
    if (!this.isInitialized) throw TorusWalletPluginError.notInitialized();
    // Not connected yet to openlogin
    if (!this.provider) {
      if (this.web3auth?.provider) {
        this.provider = this.web3auth.provider;
        this.userInfo = (await this.web3auth.getUserInfo()) as UserInfo;
      } else if (this.web3auth) {
        throw TorusWalletPluginError.web3AuthNotConnected();
      } else {
        throw TorusWalletPluginError.providerRequired();
      }
    }
    let privateKey: string | undefined;
    try {
      // it should throw if provider doesn't support `eth_private_key` function
      privateKey = (await this.provider.request<string>({ method: "eth_private_key" })) as string;
    } catch (error: unknown) {
      log.warn("unsupported method", error, TorusWalletPluginError.unsupportedAdapter());
      if ((error as EthereumRpcError<unknown>)?.code === -32004) throw TorusWalletPluginError.unsupportedAdapter();
      throw error;
    }
    if (!privateKey) throw TorusWalletPluginError.web3AuthNotConnected();
    try {
      await this.torusWalletInstance.loginWithPrivateKey({
        privateKey,
        userInfo: {
          ...(this.userInfo as Omit<UserInfo, "isNewUser">),
          typeOfLogin: this.userInfo?.typeOfLogin as LOGIN_TYPE, // openlogin's login type is subset of torus embed, so it is safe to cast.
        },
      });
      this.torusWalletInstance.showTorusButton();
      this.subscribeToProviderEvents(this.provider);
      this.subscribeToWalletEvents();
    } catch (error) {
      log.error(error);
    }
  }

  async showWalletConnectScanner(): Promise<void> {
    if (!this.torusWalletInstance.isLoggedIn) throw TorusWalletPluginError.web3AuthNotConnected();
    await this.torusWalletInstance.showWalletConnectScanner();
  }

  async initiateTopup(provider: PAYMENT_PROVIDER_TYPE, params: PaymentParams): Promise<void> {
    if (!this.torusWalletInstance.isLoggedIn) throw TorusWalletPluginError.web3AuthNotConnected();
    await this.torusWalletInstance.initiateTopup(provider, params);
  }

  async disconnect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth?.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw TorusWalletPluginError.unsupportedAdapter();
    if (this.torusWalletInstance.isLoggedIn) {
      await this.torusWalletInstance.logout();
    } else {
      throw new Error("Torus Wallet plugin is not connected");
    }
  }

  private subscribeToWalletEvents() {
    this.torusWalletInstance?.provider.on("accountsChanged", (accounts = []) => {
      if ((accounts as string[]).length === 0) {
        this.torusWalletInstance.hideTorusButton();
        if (this.web3auth?.status === ADAPTER_STATUS.CONNECTED) this.web3auth?.logout();
      }
    });
  }

  private subscribeToProviderEvents(provider: SafeEventEmitterProvider) {
    provider.on("accountsChanged", (data: { accounts: string[] } = { accounts: [] }) => {
      this.setSelectedAddress(data.accounts[0]);
    });

    provider.on("chainChanged", (data: { chainId: string }) => {
      this.setChainID(parseInt(data.chainId, 16));
    });
    provider.on("disconnect", () => {
      this.torusWalletInstance.hideTorusButton();
    });
    provider.on("connect", () => {
      this.torusWalletInstance.showTorusButton();
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
      if (!this.provider) throw TorusWalletPluginError.web3AuthNotConnected();
      this.subscribeToProviderEvents(this.provider);
    });

    web3Auth.on(ADAPTER_EVENTS.DISCONNECTED, async () => {
      this.provider = null;
      this.userInfo = null;
      if (this.torusWalletInstance.isLoggedIn) {
        await this.torusWalletInstance.logout();
      }
      this.torusWalletInstance.hideTorusButton();
    });
  }

  private async sessionConfig(): Promise<{ chainId: number; accounts: string[]; privateKey: string; chainConfig: CustomChainConfig }> {
    if (!this.provider) throw TorusWalletPluginError.web3AuthNotConnected();
    const [accounts, chainId, privateKey, chainConfig] = await Promise.all([
      this.provider.request<string[]>({ method: "eth_accounts" }),
      this.provider.request<string>({ method: "eth_chainId" }),
      this.provider.request<string>({ method: "eth_private_key" }),
      this.provider.request<CustomChainConfig>({ method: "eth_provider_config" }),
    ]);
    return {
      chainId: parseInt(chainId as string, 16),
      accounts: accounts as string[],
      privateKey: privateKey as string,
      chainConfig: chainConfig as CustomChainConfig,
    };
  }

  private async setSelectedAddress(address: string): Promise<void> {
    if (!this.torusWalletInstance.isLoggedIn || !this.userInfo) throw TorusWalletPluginError.web3AuthNotConnected();
    const sessionConfig = await this.sessionConfig();
    if (address !== sessionConfig.accounts?.[0]) {
      await this.torusWalletInstance.loginWithPrivateKey({
        privateKey: sessionConfig.privateKey,
        userInfo: {
          ...this.userInfo,
          typeOfLogin: this.userInfo?.typeOfLogin as LOGIN_TYPE, // openlogin's login type is subset of torus embed, so it is safe to cast.
        },
      });
    }
  }

  private async setChainID(chainId: number): Promise<void> {
    const sessionConfig = await this.sessionConfig();
    const { chainConfig } = sessionConfig || {};
    if (chainId !== sessionConfig.chainId && chainConfig) {
      await this.torusWalletInstance.setProvider({
        ...chainConfig,
        chainId,
        host: chainConfig.rpcTarget,
        networkName: chainConfig.displayName,
      });
    }
  }
}
