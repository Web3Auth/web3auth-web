import type { LOGIN_PROVIDER_TYPE, TorusCtorArgs, TorusParams } from "@toruslabs/solana-embed";
import {
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
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public torusInstance: Torus;

  readonly chainConfig: TorusSolanaWalletChainConfig;

  private torusWalletOptions: TorusCtorArgs;

  private initParams: TorusParams;

  private loginSettings: LoginParams = {};

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

  async init(): Promise<void> {
    if (this.ready) return;
    const { default: TorusSdk } = await import("@toruslabs/solana-embed");
    this.torusInstance = new TorusSdk(this.torusWalletOptions);
    await this.torusInstance.init({ showTorusButton: false, ...this.initParams });
    this.ready = true;
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw new WalletNotReadyError("Torus wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING);
    try {
      await this.torusInstance.login(this.loginSettings);
      // TODO: make torus embed provider type compatible with this
      this.provider = this.torusInstance.provider as unknown as SafeEventEmitterProvider;
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
