import type { LOGIN_PROVIDER_TYPE, TorusCtorArgs, TorusParams } from "@toruslabs/solana-embed";
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
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import type { TorusInjectedProviderProxy } from "@web3auth/solana-provider";
import log from "loglevel";

import type { Torus } from "./interface";

type LoginParams = {
  loginProvider?: LOGIN_PROVIDER_TYPE;
  login_hint?: string;
};
interface SolanaWalletOptions {
  adapterSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: TorusParams;
}
class SolanaWalletAdapter extends BaseAdapter<void> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public torusInstance: Torus;

  private torusWalletOptions: TorusCtorArgs;

  private initParams: TorusParams;

  private loginSettings: LoginParams = {};

  private solanaProviderProxy: TorusInjectedProviderProxy;

  constructor(params: SolanaWalletOptions) {
    super();
    this.torusWalletOptions = params.adapterSettings;
    this.initParams = params.initParams;
    this.loginSettings = params.loginSettings;
  }

  async init(options: AdapterInitOptions): Promise<void> {
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
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.TORUS_SOLANA);

    try {
      if (options.autoConnect) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached torus solana provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw WalletInitializationError.notReady("Torus wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING);
    try {
      await this.torusInstance.login(this.loginSettings);
      this.provider = this.solanaProviderProxy.setupProviderFromInjectedProvider({
        provider: this.torusInstance.provider,
      });
      this.connected = true;
      this.torusInstance.showTorusButton();
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.TORUS_SOLANA);
      return this.provider;
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with torus solana wallet");
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.torusInstance.logout();
    this.connected = false;
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.torusInstance.getUserInfo();
    return userInfo;
  }

  updateChainConfig(customChainConfig: CustomChainConfig): void {
    log.debug("new chain config for torus wallet", customChainConfig);
    if (!this.torusInstance) return;
    const { rpcTarget, chainId, displayName, blockExplorer, ticker, tickerName } = customChainConfig;
    this.connecting = true;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING);
    try {
      this.torusInstance.setProvider({
        rpcTarget,
        chainId,
        displayName,
        blockExplorerUrl: blockExplorer,
        tickerName,
        ticker,
        logo: "",
      });
      this.connected = true;
      this.torusInstance.showTorusButton();
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.TORUS_EVM);
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to update provider");
    } finally {
      this.connecting = false;
    }
  }
}

export { SolanaWalletAdapter, SolanaWalletOptions };
