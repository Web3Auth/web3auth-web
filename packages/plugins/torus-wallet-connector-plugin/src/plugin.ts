import TorusEmbed, { LOGIN_TYPE, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import { ADAPTER_EVENTS, CustomChainConfig, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS } from "@web3auth/base";
import { IPlugin, PLUGIN_NAMESPACES } from "@web3auth/base-plugin";
import type { Web3AuthCore } from "@web3auth/core";
import log from "loglevel";

import { TorusWalletPluginError } from "./errors";

export type ProviderInfo = {
  provider?: SafeEventEmitterProvider;
  userInfo?: Omit<UserInfo, "isNewUser">;
};

export class TorusWalletConnectorPlugin implements IPlugin<Web3AuthCore> {
  name = "TORUS_WALLET_CONNECTOR_PLUGIN";

  readonly pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  public torusWalletInstance: TorusEmbed | null = null;

  private provider: SafeEventEmitterProvider | null = null;

  private userInfo: UserInfo | null = null;

  private isInitialized = false;

  private walletInitOptions: TorusParams | null = null;

  constructor(options: { torusWalletOpts?: TorusCtorArgs; walletInitOptions: Partial<TorusParams> & Required<Pick<TorusParams, "whiteLabel">> }) {
    const { torusWalletOpts = {}, walletInitOptions } = options;
    const whitelabel = walletInitOptions?.whiteLabel;

    if (!whitelabel) throw new Error("whiteLabel is required");
    const { logoDark, logoLight } = whitelabel;
    if (!logoDark || !logoLight) throw new Error("logoDark and logoLight are required in whitelabel config");

    this.torusWalletInstance = new TorusEmbed(torusWalletOpts);
    this.walletInitOptions = walletInitOptions;
  }

  async initWithWeb3Auth(web3auth: Web3AuthCore): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw TorusWalletPluginError.web3authRequired();
    if (web3auth.provider && web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw TorusWalletPluginError.unsupportedAdapter();
    if (!web3auth.provider) {
      this.subscribeToWeb3AuthCoreEvents(web3auth);
    } else {
      this.provider = web3auth.provider;
      this.userInfo = (await web3auth.getUserInfo()) as UserInfo;
    }
    await (this.torusWalletInstance as TorusEmbed).init(
      {
        ...this.walletInitOptions,
        showTorusButton: false,
      } || undefined
    );
    this.isInitialized = true;
  }

  async initWithProvider(provider: SafeEventEmitterProvider, userInfo: UserInfo): Promise<void> {
    if (this.isInitialized) return;

    if (!userInfo) throw TorusWalletPluginError.userInfoRequired();
    if (!provider) throw TorusWalletPluginError.providerRequired();

    this.provider = provider;
    this.userInfo = userInfo;
    await (this.torusWalletInstance as TorusEmbed).init(this.walletInitOptions || undefined);
    this.isInitialized = true;
  }

  async connect(): Promise<void> {
    if (!this.isInitialized || !this.torusWalletInstance) throw TorusWalletPluginError.notInitialized();
    if (!this.provider) throw TorusWalletPluginError.web3AuthNotConnected();
    let privateKey;
    try {
      // it should throw if provider doesn't support `eth_private_key` function
      privateKey = await this.provider.request<string>({ method: "eth_private_key" });
    } catch (error) {
      log.warn("unsupported method", error, TorusWalletPluginError.unsupportedAdapter());
      throw TorusWalletPluginError.unsupportedAdapter();
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
    } catch (error) {
      log.error(error);
    }
  }

  async showWalletConnectScanner(): Promise<void> {
    if (!this.torusWalletInstance?.isLoggedIn) throw TorusWalletPluginError.web3AuthNotConnected();
    await this.torusWalletInstance.showWalletConnectScanner();
  }

  async disconnect(): Promise<void> {
    if (this.torusWalletInstance?.isLoggedIn) {
      await this.torusWalletInstance.logout();
      this.torusWalletInstance.hideTorusButton();
    } else {
      throw new Error("Torus Wallet plugin is not connected");
    }
  }

  private subscribeToProviderEvents(provider: SafeEventEmitterProvider) {
    provider.on("accountsChanged", (data: { accounts: string[] }) => {
      this.setSelectedAddress(data.accounts[0]);
    });

    provider.on("chainChanged", (data: { chainId: string }) => {
      this.setChainID(parseInt(data.chainId, 16));
    });
    provider.on("disconnect", () => {
      this.torusWalletInstance?.hideTorusButton();
    });
    provider.on("connect", () => {
      this.torusWalletInstance?.showTorusButton();
    });
  }

  private subscribeToWeb3AuthCoreEvents(web3Auth: Web3AuthCore) {
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
    if (!this.torusWalletInstance?.isLoggedIn || !this.userInfo) throw TorusWalletPluginError.web3AuthNotConnected();
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
      await this.torusWalletInstance?.setProvider({
        ...chainConfig,
        chainId,
        host: chainConfig.rpcTarget,
        networkName: chainConfig.displayName,
      });
    }
  }
}
