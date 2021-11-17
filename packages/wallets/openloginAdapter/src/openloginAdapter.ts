import type openlogin from "@toruslabs/openlogin";
import {
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
} from "@web3auth/base";
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
    }
    this.ready = true;
  }

  async connect(): Promise<void> {
    if (!this.ready) throw new Error("Openlogin wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING);
    try {
      const privateKey = this.openloginInstance.privKey;
      if (!privateKey) {
        await this.openloginInstance.login(this.loginSettings);
      }
      this.provider = this.solanaProviderFactory.setupProvider(privateKey);
      this.connected = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTED);
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
