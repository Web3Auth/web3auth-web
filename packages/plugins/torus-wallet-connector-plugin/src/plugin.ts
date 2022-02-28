import TorusEmbed, { TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import { ADAPTER_EVENTS, CustomChainConfig, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS } from "@web3auth/base";
import type { Web3AuthCore } from "@web3auth/core";
import log from "loglevel";

import { TorusWalletPluginError } from "./errors";

export type ProviderInfo = {
  provider?: SafeEventEmitterProvider;
  userInfo?: UserInfo;
};

export class TorusWalletConnectorPlugin {
  private torusWalletInstance: TorusEmbed | null = null;

  private provider: SafeEventEmitterProvider | null = null;

  private userInfo: UserInfo | null = null;

  constructor(options: { providerInfo?: ProviderInfo; web3Auth?: Web3AuthCore; torusWalletOpts?: TorusCtorArgs } = {}) {
    const { web3Auth, torusWalletOpts } = options;
    const { provider, userInfo } = options.providerInfo || {};

    if (!provider && !web3Auth) throw TorusWalletPluginError.providerOrWeb3AuthRequired();
    if (provider) {
      this.provider = provider;
      if (!userInfo) throw TorusWalletPluginError.userInfoRequired();
      this.userInfo = userInfo;
    } else if (web3Auth) {
      if (web3Auth.provider) {
        if (web3Auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw TorusWalletPluginError.unsupportedAdapter();
        this.provider = web3Auth.provider;
        this.subscribeToProviderEvents(this.provider);
      } else {
        this.subscribeToWeb3AuthCoreEvents(web3Auth);
      }
    }
    this.torusWalletInstance = new TorusEmbed(torusWalletOpts);
  }

  async init(options: TorusParams): Promise<void> {
    // setting torusWalletInstance in constructor.
    await (this.torusWalletInstance as TorusEmbed).init(options);
  }

  async connect(): Promise<void> {
    if (!this.provider) throw TorusWalletPluginError.web3AuthNotConnected();
    if (!this.torusWalletInstance?.isInitialized) throw TorusWalletPluginError.notInitialized();
    let privateKey;
    try {
      // it should throw if provider doesn't support `eth_private_key` function
      privateKey = await this.provider.request<string>({ method: "eth_private_key" });
    } catch (error) {
      log.error("unsupported method", error);
      throw TorusWalletPluginError.unsupportedAdapter();
    }
    if (!privateKey) throw TorusWalletPluginError.web3AuthNotConnected();
    // await this.torusWalletInstance.loginWithPrivateKey({
    //   privateKey,
    //   userInfo: {
    //     ...(this.userInfo || {}),
    //   },
    // });
  }

  async disconnect(): Promise<void> {
    if (this.torusWalletInstance?.provider) {
      await this.torusWalletInstance.logout();
    } else {
      throw new Error("Torus Wallet plugin is not connected");
    }
  }

  private subscribeToWeb3AuthCoreEvents(web3Auth: Web3AuthCore) {
    web3Auth.on(ADAPTER_EVENTS.CONNECTED, () => {
      this.provider = web3Auth.provider;
      if (!this.provider) throw TorusWalletPluginError.web3AuthNotConnected();
      this.subscribeToProviderEvents(this.provider);
    });
  }

  private subscribeToProviderEvents(provider: SafeEventEmitterProvider) {
    provider.on("accountsChanged", (data: { accounts: string[] }) => {
      this.setSelectedAddress(data.accounts[0]);
    });

    provider.on("chainChanged", (data: { chainId: string }) => {
      this.setChainID(parseInt(data.chainId, 16));
    });
  }

  private async sessionConfig(): Promise<{ chainId: number; accounts: string[]; privateKey: string; chainConfig: CustomChainConfig }> {
    if (!this.provider) throw TorusWalletPluginError.providerOrWeb3AuthRequired();
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
    const sessionConfig = await this.sessionConfig();
    if (address !== sessionConfig.accounts?.[0]) {
      // await this.torusWalletInstance.loginWithPrivateKey({
      //   privateKey: sessionConfig.privateKey,
      //   userInfo: {
      //     ...(this.userInfo || {}),
      //   },
      // });
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
