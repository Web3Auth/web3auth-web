import { Wallet } from "@wallet-standard/base";
import { StandardConnect, StandardDisconnect } from "@wallet-standard/features";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapterSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WalletLoginError,
} from "@web3auth/base";
import { BaseSolanaAdapter } from "@web3auth/base-solana-adapter";
import { WalletStandardProvider } from "@web3auth/solana-provider";

import { getSolanaChainByChainConfig } from "./utils";
import { WalletStandard, WalletStandardProviderHandler } from "./walletStandardHandler";

export class WalletStandardAdapter extends BaseSolanaAdapter<void> {
  readonly name: string;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  private wallet: WalletStandard | null = null;

  private injectedProvider: WalletStandardProvider | null = null;

  constructor(
    options: BaseAdapterSettings & {
      name: string;
      wallet: Wallet;
    }
  ) {
    super(options);
    this.name = options.name;
    // in VueJS, for some wallets e.g. Gate, Solflare, when connecting it throws error "attempted to get private field on non-instance"
    // it seems that Vue create a Proxy object for the wallet object which causes the issue
    // ref: https://stackoverflow.com/questions/64917686/vue-array-converted-to-proxy-object
    this.wallet = (["gate", "solflare"].includes(this.name) ? Object.freeze(options.wallet) : options.wallet) as WalletStandard;
  }

  get provider(): IProvider {
    if (this.status !== ADAPTER_STATUS.NOT_READY && this.injectedProvider) {
      return this.injectedProvider;
    }
    return null;
  }

  get isWalletConnected(): boolean {
    return !!(this.status === ADAPTER_STATUS.CONNECTED && this.wallet.accounts.length > 0);
  }

  async init(options: AdapterInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();

    this.injectedProvider = new WalletStandardProvider({ config: { chainConfig: this.chainConfig } });
    const providerHandler = new WalletStandardProviderHandler({
      wallet: this.wallet,
      getCurrentChain: () => getSolanaChainByChainConfig(this.chainConfig),
    });
    this.injectedProvider.setupProvider(providerHandler);

    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, this.name);

    try {
      log.debug("initializing solana injected adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached solana injected provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(): Promise<IProvider> {
    try {
      super.checkConnectionRequirements();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: this.name });

      const chainName = getSolanaChainByChainConfig(this.chainConfig);
      if (!this.wallet.chains.find((chain) => chain === chainName))
        throw WalletLoginError.connectionError(`Chain ${chainName} not supported. Supported chains are ${this.wallet.chains.join(", ")}`);

      if (!this.isWalletConnected) {
        await this.wallet.features[StandardConnect].connect();
      }
      if (this.wallet.accounts.length === 0) throw WalletLoginError.connectionError();

      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, {
        adapter: this.name,
        reconnected: this.rehydrated,
        provider: this.provider,
      } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error: unknown) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      throw error;
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    try {
      await this.wallet.features[StandardDisconnect]?.disconnect();
      if (options.cleanup) {
        this.status = ADAPTER_STATUS.NOT_READY;
        this.injectedProvider = null;
      } else {
        this.status = ADAPTER_STATUS.READY;
      }
      await super.disconnect();
    } catch (error: unknown) {
      this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message));
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    this.injectedProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.injectedProvider?.switchChain(params);
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  async enableMFA(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
