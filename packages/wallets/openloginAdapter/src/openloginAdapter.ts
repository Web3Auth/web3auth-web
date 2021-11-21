import type openlogin from "@toruslabs/openlogin";
import {
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  PROVIDER_EVENTS,
  SafeEventEmitterProvider,
  UserInfo,
} from "@web3auth/base";
import { EthereumProvider } from "@web3auth/ethereum-provider";
import { SolanaProvider } from "@web3auth/solana-provider";

import type { LoginSettings, OpenLoginOptions } from "./interface";

class OpenloginAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType;

  readonly currentChainNamespace: ChainNamespaceType;

  public openloginInstance: openlogin;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  private openloginOptions: Partial<OpenLoginOptions> & Pick<OpenLoginOptions, "clientId" | "network">;

  private loginSettings: LoginSettings = {};

  private chainConfig: CustomChainConfig;

  private solanaProviderFactory: SolanaProvider;

  private ethereumProviderFactory: EthereumProvider;

  constructor(params: { chainConfig: CustomChainConfig; openLoginOptions: OpenLoginOptions; loginSettings: LoginSettings }) {
    super();
    this.openloginOptions = params.openLoginOptions;
    this.loginSettings = params.loginSettings;
    this.currentChainNamespace = this.chainConfig.chainNamespace;
  }

  async init(): Promise<void> {
    if (this.ready) return;
    const { default: OpenloginSdk } = await import("@toruslabs/openlogin");
    this.openloginInstance = new OpenloginSdk(this.openloginOptions);
    await this.openloginInstance.init();
    if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      this.solanaProviderFactory = new SolanaProvider(this.chainConfig);
      await this.solanaProviderFactory.init();
    } else if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      this.ethereumProviderFactory = new EthereumProvider(this.chainConfig);
      await this.ethereumProviderFactory.init();
    } else {
      throw new Error(`Invalid chainNamespace: ${this.chainConfig.chainNamespace} found while connecting to wallet`);
    }
    this.ready = true;
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw new Error("Openlogin wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING);
    try {
      const privateKey = this.openloginInstance.privKey;
      if (!privateKey) {
        await this.openloginInstance.login(this.loginSettings);
      }
      const providerResolver = async (providerFactory: SolanaProvider | EthereumProvider): Promise<SafeEventEmitterProvider> => {
        return new Promise((resolve, reject) => {
          providerFactory.on(PROVIDER_EVENTS.INITIALIZED, () => {
            const provider = providerFactory.setupProvider(privateKey);
            this.connected = true;
            this.emit(BASE_WALLET_EVENTS.CONNECTED);
            resolve(provider);
          });
          providerFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
            this.emit(BASE_WALLET_EVENTS.ERRORED, error);
            reject(error);
          });
        });
      };
      if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        return await providerResolver(this.solanaProviderFactory);
      } else if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
        return await providerResolver(this.ethereumProviderFactory);
      }
      throw new Error(`Invalid chainNamespace: ${this.chainConfig.chainNamespace} found while connecting to wallet`);
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new Error("Not connected with wallet");
    await this.openloginInstance.logout();
    await this.openloginInstance._cleanup();
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new Error("Not connected with wallet, Please login/connect first");
    const userInfo = await this.openloginInstance.getUserInfo();
    return userInfo;
  }
}

export { LoginSettings, OpenloginAdapter, OpenLoginOptions };
