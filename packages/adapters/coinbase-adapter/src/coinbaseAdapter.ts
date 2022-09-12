import CoinbaseWalletSDK, { CoinbaseWalletProvider } from "@coinbase/wallet-sdk";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  getChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletLoginError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";

export type CoinbaseWalletSDKOptions = ConstructorParameters<typeof CoinbaseWalletSDK>[0];

export interface CoinbaseAdapterOptions {
  chainConfig?: CustomChainConfig;
  adapterSettings?: CoinbaseWalletSDKOptions;
  clientId?: string;
}

class CoinbaseAdapter extends BaseEvmAdapter<void> {
  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_ADAPTERS.COINBASE;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public coinbaseInstance: CoinbaseWalletSDK | null = null;

  private coinbaseProvider: CoinbaseWalletProvider | null = null;

  private coinbaseOptions: CoinbaseWalletSDKOptions;

  private rehydrated = false;

  constructor(adapterOptions: CoinbaseAdapterOptions) {
    super(adapterOptions);
    this.chainConfig = adapterOptions?.chainConfig || null;
    this.coinbaseOptions = adapterOptions?.adapterSettings || { appName: "Web3Auth" };
  }

  get provider(): SafeEventEmitterProvider | null {
    if (this.status === ADAPTER_STATUS.CONNECTED && this.coinbaseProvider) {
      return this.coinbaseProvider as unknown as SafeEventEmitterProvider;
    }
    return null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    this.coinbaseInstance = new CoinbaseWalletSDK(this.coinbaseOptions);
    if (!this.chainConfig) this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
    const { chainId, rpcTarget } = this.chainConfig;
    this.coinbaseProvider = this.coinbaseInstance.makeWeb3Provider(rpcTarget, Number.parseInt(chainId, 16));
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.COINBASE);
    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      this.emit(ADAPTER_EVENTS.ERRORED, error);
    }
  }

  setAdapterSettings(options: { sessionTime?: number; clientId?: string }): void {
    if (this.status === ADAPTER_STATUS.READY) return;
    if (options?.sessionTime) {
      this.sessionTime = options.sessionTime;
    }
    if (options?.clientId) {
      this.clientId = options.clientId;
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    // set default to mainnet
    if (!this.chainConfig) this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);

    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.COINBASE });
    if (!this.coinbaseProvider) throw WalletLoginError.notConnectedError("Adapter is not initialized");
    try {
      await this.coinbaseProvider.request({ method: "eth_requestAccounts" });
      const { chainId } = this.coinbaseProvider;
      if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
        await this.switchChain(this.chainConfig as CustomChainConfig);
      }
      this.status = ADAPTER_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");
      this.provider.once("disconnect", () => {
        // ready to be connected again
        this.disconnect();
      });
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.COINBASE, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with coinbase wallet");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnect();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.coinbaseProvider = null;
    } else {
      // ready to be connected again
      this.status = ADAPTER_STATUS.READY;
    }

    this.rehydrated = false;
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private async switchChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this.coinbaseProvider) throw WalletLoginError.notConnectedError("Not connected with wallet");
    try {
      await this.coinbaseProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainConfig.chainId }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to Coinbase Wallet.
      if ((switchError as { code: number }).code === 4902) {
        await this.coinbaseProvider.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: chainConfig.chainId, chainName: chainConfig.displayName, rpcUrls: [chainConfig.rpcTarget] }],
        });
      } else {
        throw switchError;
      }
    }
  }
}

export { CoinbaseAdapter };
