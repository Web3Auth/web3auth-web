import type { LOGIN_PROVIDER_TYPE, TorusCtorArgs, TorusParams } from "@toruslabs/solana-embed";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  SafeEventEmitterProvider,
  TorusSolanaWalletChainConfig,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletNotConnectedError,
  WalletNotReadyError,
} from "@web3auth/base";
import type { TorusInjectedProviderProxy } from "@web3auth/solana-provider";
import log from "loglevel";

import type { Torus } from "./interface";
type LoginParams = {
  loginProvider?: LOGIN_PROVIDER_TYPE;
  login_hint?: string;
};
interface SolanaWalletOptions {
  chainConfig?: TorusSolanaWalletChainConfig;
  adapterSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: TorusParams;
}
class SolanaWalletAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public torusInstance: Torus;

  readonly chainConfig: TorusSolanaWalletChainConfig;

  private torusWalletOptions: TorusCtorArgs;

  private initParams: TorusParams;

  private loginSettings: LoginParams = {};

  private solanaProviderProxy: TorusInjectedProviderProxy;

  constructor(params: SolanaWalletOptions) {
    super();
    this.torusWalletOptions = params.adapterSettings;
    this.initParams = {
      ...params.initParams,
      network: params.chainConfig,
    };
    this.chainConfig = params.chainConfig;
    this.loginSettings = params.loginSettings;
  }

  async init(options: { connect: boolean }): Promise<void> {
    if (this.ready) return;
    const { default: TorusSdk } = await import("@toruslabs/solana-embed");
    this.torusInstance = new TorusSdk(this.torusWalletOptions);
    await this.torusInstance.init({ showTorusButton: false, ...this.initParams });
    const { TorusInjectedProviderProxy: SolanaProviderProxy } = await import("@web3auth/solana-provider");
    this.solanaProviderProxy = new SolanaProviderProxy({
      config: {},
    });
    await this.solanaProviderProxy.init();
    this.ready = true;
    this.emit(BASE_WALLET_EVENTS.READY, WALLET_ADAPTERS.TORUS_SOLANA_WALLET);

    try {
      if (options.connect) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached torus solana provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw new WalletNotReadyError("Torus wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING);
    try {
      await this.torusInstance.login(this.loginSettings);
      this.provider = this.solanaProviderProxy.setupProviderFromInjectedProvider({
        provider: this.torusInstance.provider,
      });
      this.connected = true;
      this.torusInstance.showTorusButton();
      this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.TORUS_SOLANA_WALLET);
      return this.provider;
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
      throw new WalletConnectionError("Failed to login with torus solana wallet", error);
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet");
    await this.torusInstance.logout();
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.torusInstance.getUserInfo();
    return userInfo;
  }
}

export { SolanaWalletAdapter, SolanaWalletOptions };
