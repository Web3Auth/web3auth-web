import TorusEmbed, { PAYMENT_PROVIDER_TYPE, PaymentParams, TorusCtorArgs, TorusParams } from "@toruslabs/solana-embed";
import { ADAPTER_EVENTS, CustomChainConfig, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS } from "@web3auth/base";
import { IPlugin, PLUGIN_NAMESPACES } from "@web3auth/base-plugin";
import type { Web3AuthCore } from "@web3auth/core";
import type { EthereumRpcError } from "eth-rpc-errors";
import log from "loglevel";

import { SolanaWalletPluginError } from "./errors";

export type ProviderInfo = {
  provider?: SafeEventEmitterProvider;
  userInfo?: Omit<UserInfo, "isNewUser">;
};

export class SolanaWalletConnectorPlugin implements IPlugin {
  name = "SOLANA_WALLET_CONNECTOR_PLUGIN";

  readonly pluginNamespace = PLUGIN_NAMESPACES.SOLANA;

  public torusWalletInstance: TorusEmbed;

  private provider: SafeEventEmitterProvider | null = null;

  private web3auth: Web3AuthCore | null = null;

  private userInfo: UserInfo | null = null;

  private isInitialized = false;

  private walletInitOptions: TorusParams | null = null;

  constructor(options: { torusWalletOpts?: TorusCtorArgs; walletInitOptions: Partial<TorusParams> }) {
    const { torusWalletOpts = {}, walletInitOptions } = options;
    // const whiteLabel = walletInitOptions?.whiteLabel;

    // if (!whiteLabel) throw new Error("whiteLabel is required");
    // const { logoDark, logoLight } = whiteLabel;
    // if (!logoDark || !logoLight) throw new Error("logoDark and logoLight are required in whiteLabel config");

    this.torusWalletInstance = new TorusEmbed(torusWalletOpts);
    this.walletInitOptions = walletInitOptions;
  }

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.torusWalletInstance.isLoggedIn ? (this.torusWalletInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: Web3AuthCore): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw SolanaWalletPluginError.web3authRequired();
    if (web3auth.provider && web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw SolanaWalletPluginError.unsupportedAdapter();
    // Not connected yet to openlogin
    if (web3auth.provider) {
      this.provider = web3auth.provider;
      this.userInfo = (await web3auth.getUserInfo()) as UserInfo;
    }
    this.web3auth = web3auth;
    this.subscribeToWeb3AuthCoreEvents(web3auth);

    const connectedChainConfig = web3auth.coreOptions.chainConfig as CustomChainConfig;

    await this.torusWalletInstance.init({
      ...(this.walletInitOptions || {}),
      network: {
        ...connectedChainConfig,
        blockExplorerUrl: connectedChainConfig.blockExplorer,
        logo: "",
        chainId: connectedChainConfig.chainId,
        rpcTarget: connectedChainConfig.rpcTarget,
        displayName: connectedChainConfig.displayName,
      },
      showTorusButton: false,
    });
    this.isInitialized = true;
  }

  async initWithProvider(provider: SafeEventEmitterProvider, userInfo: UserInfo): Promise<void> {
    if (this.isInitialized) return;

    if (!userInfo) throw SolanaWalletPluginError.userInfoRequired();
    if (!provider) throw SolanaWalletPluginError.providerRequired();

    this.provider = provider;
    this.userInfo = userInfo;
    await this.torusWalletInstance.init(this.walletInitOptions || {});
    this.isInitialized = true;
  }

  async connect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth && this.web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw SolanaWalletPluginError.unsupportedAdapter();
    if (!this.isInitialized) throw SolanaWalletPluginError.notInitialized();
    // Not connected yet to openlogin
    if (!this.provider) {
      if (this.web3auth?.provider) {
        this.provider = this.web3auth.provider;
        this.userInfo = (await this.web3auth.getUserInfo()) as UserInfo;
      } else if (this.web3auth) {
        throw SolanaWalletPluginError.web3AuthNotConnected();
      } else {
        throw SolanaWalletPluginError.providerRequired();
      }
    }
    let privateKey: string | undefined;

    try {
      // it should throw if provider doesn't support `solanaSecretKey` function
      privateKey = (await this.provider.request<string>({ method: "solanaSecretKey" })) as string;
    } catch (error: unknown) {
      log.warn("unsupported method", error, SolanaWalletPluginError.unsupportedAdapter());
      if ((error as EthereumRpcError<unknown>)?.code === -32004) throw SolanaWalletPluginError.unsupportedAdapter();
      throw error;
    }
    if (!privateKey) throw SolanaWalletPluginError.web3AuthNotConnected();
    try {
      await this.torusWalletInstance.loginWithPrivateKey({
        privateKey,
        userInfo: {
          ...(this.userInfo as Omit<UserInfo, "isNewUser">),
        },
      });
      this.torusWalletInstance.showTorusButton();
      this.subscribeToProviderEvents(this.provider);
    } catch (error) {
      log.error(error);
    }
  }

  async initiateTopup(provider: PAYMENT_PROVIDER_TYPE, params: PaymentParams): Promise<void> {
    if (!this.torusWalletInstance.isLoggedIn) throw SolanaWalletPluginError.web3AuthNotConnected();
    await this.torusWalletInstance.initiateTopup(provider, params);
  }

  async disconnect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.web3auth?.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw SolanaWalletPluginError.unsupportedAdapter();
    if (this.torusWalletInstance.isLoggedIn) {
      await this.torusWalletInstance.logout();
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
      this.torusWalletInstance.hideTorusButton();
    });
    provider.on("connect", () => {
      this.torusWalletInstance.showTorusButton();
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
      if (!this.provider) throw SolanaWalletPluginError.web3AuthNotConnected();
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
    if (!this.provider) throw SolanaWalletPluginError.web3AuthNotConnected();
    const [accounts, chainId, privateKey, chainConfig] = await Promise.all([
      this.provider.request<string[]>({ method: "requestAccounts" }),
      this.provider.request<string>({ method: "solana_chainId" }),
      this.provider.request<string>({ method: "solanaSecretKey" }),
      this.provider.request<CustomChainConfig>({ method: "solana_provider_config" }),
    ]);
    return {
      chainId: parseInt(chainId as string, 16),
      accounts: accounts as string[],
      privateKey: privateKey as string,
      chainConfig: chainConfig as CustomChainConfig,
    };
  }

  private async setSelectedAddress(address: string): Promise<void> {
    if (!this.torusWalletInstance.isLoggedIn || !this.userInfo) throw SolanaWalletPluginError.web3AuthNotConnected();
    const sessionConfig = await this.sessionConfig();
    if (address !== sessionConfig.accounts?.[0]) {
      await this.torusWalletInstance.loginWithPrivateKey({
        privateKey: sessionConfig.privateKey,
        userInfo: {
          ...this.userInfo,
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
        blockExplorerUrl: chainConfig.blockExplorer,
        logo: "",
        chainId: `0x${chainId.toString(16)}`,
        rpcTarget: chainConfig.rpcTarget,
        displayName: chainConfig.displayName,
      });
    }
  }
}
