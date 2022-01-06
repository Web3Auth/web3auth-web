import type { LoginParams, NetworkInterface, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterInitOptions,
  AdapterNamespaceType,
  BASE_ADAPTER_EVENTS,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  getChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import log from "loglevel";

import type { Torus } from "./interface";
interface TorusWalletOptions {
  adapterSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: Omit<TorusParams, "network">;
  chainConfig?: CustomChainConfig;
}
class TorusWalletAdapter extends BaseAdapter<never> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting = false;

  public ready = false;

  public connected = false;

  public provider!: SafeEventEmitterProvider;

  public torusInstance!: Torus;

  private torusWalletOptions?: TorusCtorArgs;

  private initParams?: TorusParams;

  private loginSettings?: LoginParams = {};

  constructor(params: TorusWalletOptions) {
    super();
    this.torusWalletOptions = params.adapterSettings || {};
    this.initParams = params.initParams || {};
    this.loginSettings = params.loginSettings || {};
    this.chainConfig = params.chainConfig;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    // set chainConfig for mainnet by default if not set
    let network: NetworkInterface | undefined;
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
      const { blockExplorer, displayName } = this.chainConfig as CustomChainConfig;
      network = { chainId: 1, host: "mainnet", blockExplorer, networkName: displayName };
    } else {
      const { chainId, blockExplorer, displayName, rpcTarget } = this.chainConfig as CustomChainConfig;
      network = { chainId: parseInt(chainId as string, 16), host: rpcTarget, blockExplorer, networkName: displayName };
    }
    if (this.ready) return;
    const { default: TorusSdk } = await import("@toruslabs/torus-embed");
    this.torusInstance = new TorusSdk(this.torusWalletOptions);
    await this.torusInstance.init({
      showTorusButton: false,
      ...this.initParams,
      network,
    });
    this.ready = true;
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.TORUS_EVM);

    try {
      if (options.autoConnect) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with torus evm provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw WalletInitializationError.notReady("Torus wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.TORUS_EVM });
    try {
      await this.torusInstance.login(this.loginSettings);
      this.provider = this.torusInstance.provider as unknown as SafeEventEmitterProvider;
      this.connected = true;
      this.torusInstance.showTorusButton();
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.TORUS_EVM);
      return this.torusInstance.provider as unknown as SafeEventEmitterProvider;
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with torus wallet");
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    await this.torusInstance.logout();
    this.torusInstance.hideTorusButton();
    this.connected = false;
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.torusInstance.getUserInfo("");
    return userInfo;
  }

  setAdapterSettings(_: unknown): void {}
}

export { TorusWalletAdapter, TorusWalletOptions };
