import type { LoginParams, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
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
  TorusEthWalletChainConfig,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletNotConnectedError,
  WalletNotReadyError,
} from "@web3auth/base";

import type { Torus } from "./interface";

interface TorusWalletOptions {
  chainConfig: TorusEthWalletChainConfig;
  adapterSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: TorusParams;
}
class TorusWalletAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public torusInstance: Torus;

  readonly chainConfig: TorusEthWalletChainConfig;

  private torusWalletOptions: TorusCtorArgs;

  private initParams: TorusParams;

  private loginSettings: LoginParams = {};

  constructor(params: TorusWalletOptions) {
    super();
    this.torusWalletOptions = params.adapterSettings;
    this.initParams = params.initParams;
    this.chainConfig = params.chainConfig;
    this.loginSettings = params.loginSettings;
  }

  async init(options: { connect: boolean }): Promise<void> {
    if (this.ready) return;
    const { default: TorusSdk } = await import("@toruslabs/torus-embed");
    this.torusInstance = new TorusSdk(this.torusWalletOptions);
    await this.torusInstance.init({ showTorusButton: false, ...this.initParams });
    this.ready = true;
    if (options.connect) await this.connect();
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
      this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.TORUS_EVM_WALLET);
      return this.torusInstance.provider as unknown as SafeEventEmitterProvider;
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
      throw new WalletConnectionError("Failed to login with torus wallet", error);
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    await this.torusInstance.logout();
    this.torusInstance.hideTorusButton();
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.torusInstance.getUserInfo("");
    return userInfo;
  }
}

export { TorusWalletAdapter, TorusWalletOptions };
