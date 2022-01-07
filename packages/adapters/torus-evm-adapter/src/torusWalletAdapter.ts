import Torus, { LoginParams, NetworkInterface, TorusCtorArgs, TorusParams } from "@toruslabs/torus-embed";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
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

interface TorusWalletOptions {
  adapterSettings?: TorusCtorArgs;
  loginSettings?: LoginParams;
  initParams?: Omit<TorusParams, "network">;
  chainConfig?: CustomChainConfig;
}

class TorusWalletAdapter extends BaseAdapter<never> {
  readonly name: string = WALLET_ADAPTERS.TORUS_EVM;

  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider: SafeEventEmitterProvider | null = null;

  public torusInstance: Torus | null = null;

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
    super.checkInitializationRequirements();
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
    this.torusInstance = new Torus(this.torusWalletOptions);
    await this.torusInstance.init({
      showTorusButton: false,
      ...this.initParams,
      network,
    });
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_STATUS.READY, WALLET_ADAPTERS.TORUS_EVM);

    try {
      if (options.autoConnect) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with torus evm provider", error);
      this.emit(ADAPTER_STATUS.ERRORED, error);
    }
  }

  async connect(): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus is not initialized");
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_STATUS.CONNECTING, { adapter: WALLET_ADAPTERS.TORUS_EVM });
    try {
      await this.torusInstance.login(this.loginSettings);
      const { chainId } = this.torusInstance.provider;
      if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
        this.emit(
          ADAPTER_STATUS.ERRORED,
          WalletInitializationError.invalidNetwork(
            `Not connected to correct chainId. Expected: ${(this.chainConfig as CustomChainConfig).chainId}, Current: ${chainId}`
          )
        );
        return;
      }
      this.provider = this.torusInstance.provider as unknown as SafeEventEmitterProvider;
      this.status = ADAPTER_STATUS.CONNECTED;
      this.torusInstance.showTorusButton();
      this.emit(ADAPTER_STATUS.CONNECTED, WALLET_ADAPTERS.TORUS_EVM);
    } catch (error) {
      this.emit(ADAPTER_STATUS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with torus wallet");
    }
  }

  async disconnect(): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus is not initialized");
    await this.torusInstance.logout();
    this.torusInstance.hideTorusButton();
    this.status = ADAPTER_STATUS.DISCONNECTED;
    this.emit(ADAPTER_STATUS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.torusInstance) throw WalletInitializationError.notReady("Torus is not initialized");
    const userInfo = await this.torusInstance.getUserInfo("");
    return userInfo;
  }

  setAdapterSettings(_: unknown): void {}
}

export { TorusWalletAdapter, TorusWalletOptions };
