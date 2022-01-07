import Torus, { NetworkInterface, TorusCtorArgs, TorusLoginParams, TorusParams } from "@toruslabs/solana-embed";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
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
  WalletLoginError,
} from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import type { InjectedProvider } from "@web3auth/solana-provider";
import log from "loglevel";

interface SolanaWalletOptions {
  adapterSettings?: TorusCtorArgs;
  loginSettings?: TorusLoginParams;
  initParams?: Omit<TorusParams, "network">;
  chainConfig?: CustomChainConfig;
}
type ProviderFactory = BaseProvider<BaseProviderConfig, BaseProviderState, InjectedProvider>;

class SolanaWalletAdapter extends BaseAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.TORUS_SOLANA;

  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider!: SafeEventEmitterProvider;

  public torusInstance!: Torus;

  private torusWalletOptions?: TorusCtorArgs;

  private initParams?: TorusParams;

  private loginSettings?: TorusLoginParams = {};

  private solanaProviderProxy!: ProviderFactory;

  constructor(params: SolanaWalletOptions) {
    super();
    this.torusWalletOptions = params.adapterSettings || {};
    this.initParams = params.initParams || {};
    this.loginSettings = params.loginSettings || {};
    this.chainConfig = params.chainConfig;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    // set chainConfig for mainnet by default if not set
    let network: NetworkInterface | undefined;
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.SOLANA, "0x1");
      const { blockExplorer, displayName, ticker, tickerName } = this.chainConfig as CustomChainConfig;
      network = { chainId: "0x1", rpcTarget: "mainnet", blockExplorerUrl: blockExplorer, displayName, ticker, tickerName, logo: "" };
    } else {
      const { chainId, blockExplorer, displayName, rpcTarget, ticker, tickerName } = this.chainConfig as CustomChainConfig;
      network = { chainId, rpcTarget, blockExplorerUrl: blockExplorer, displayName, tickerName, ticker, logo: "" };
    }
    const { default: TorusSdk } = await import("@toruslabs/solana-embed");
    this.torusInstance = new TorusSdk(this.torusWalletOptions);
    await this.torusInstance.init({ showTorusButton: false, ...this.initParams, network });
    const { TorusInjectedProvider: SolanaProviderProxy } = await import("@web3auth/solana-provider");
    this.solanaProviderProxy = new SolanaProviderProxy({
      config: {
        chainConfig: this.chainConfig as CustomChainConfig,
      },
    });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_STATUS.READY, WALLET_ADAPTERS.TORUS_SOLANA);

    try {
      if (options.autoConnect) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached torus solana provider", error);
      this.emit(ADAPTER_STATUS.ERRORED, error);
    }
  }

  async connect(): Promise<void> {
    super.checkConnectionRequirements();
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_STATUS.CONNECTING, { adapter: WALLET_ADAPTERS.TORUS_SOLANA });
    try {
      await this.torusInstance.login(this.loginSettings);
      this.provider = await this.solanaProviderProxy.setupProvider(this.torusInstance.provider as InjectedProvider);
      this._onConnectHandler();
      return;
    } catch (error) {
      // if ((error as Web3AuthError).code === 5013) {
      //   // try to change network once if user is connected to wrong network
      //   this.provider = await this.solanaProviderProxy.setupProvider(this.torusInstance.provider as InjectedProvider);
      // } else {
      //   throw error;
      // }
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with torus solana wallet");
    }
  }

  async disconnect(): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.torusInstance.logout();
    this.status = ADAPTER_STATUS.DISCONNECTED;
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    const userInfo = await this.torusInstance.getUserInfo();
    return userInfo;
  }

  setAdapterSettings(_: unknown): void {}

  private _onConnectHandler() {
    this.status = ADAPTER_STATUS.DISCONNECTED;
    this.torusInstance.showTorusButton();
    this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.TORUS_SOLANA);
  }
}

export { SolanaWalletAdapter, SolanaWalletOptions };
