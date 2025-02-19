import { Wallet } from "@wallet-standard/base";
import { StandardConnect, StandardDisconnect } from "@wallet-standard/features";

import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterFn,
  AdapterInitOptions,
  AdapterNamespaceType,
  AdapterParams,
  BaseAdapterSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  IProvider,
  log,
  UserInfo,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";
import { WalletStandardProvider } from "@/core/solana-provider";

import { BaseSolanaAdapter } from "../base-solana-adapter";
import { getSolanaChainByChainConfig } from "./utils";
import { WalletStandard, WalletStandardProviderHandler } from "./walletStandardHandler";

export class WalletStandardAdapter extends BaseSolanaAdapter<void> {
  readonly name: string;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.SOLANA;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.SOLANA;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly isInjected = true;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  private wallet: WalletStandard | null = null;

  private injectedProvider: WalletStandardProvider | null = null;

  constructor(options: BaseAdapterSettings & { name: string; wallet: Wallet }) {
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

  async init(options: AdapterInitOptions): Promise<void> {
    await super.init(options);
    const chainConfig = this.coreOptions.chainConfigs.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });

    this.injectedProvider = new WalletStandardProvider({ config: { chainConfig } });
    const providerHandler = new WalletStandardProviderHandler({
      wallet: this.wallet,
      getCurrentChain: () => getSolanaChainByChainConfig(chainConfig),
    });
    this.injectedProvider.setupProvider(providerHandler);

    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, this.name);

    try {
      log.debug("initializing solana injected adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect({ chainId: options.chainId });
      }
    } catch (error) {
      log.error("Failed to connect with cached solana injected provider", error);
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect({ chainId }: { chainId: string }): Promise<IProvider> {
    try {
      super.checkConnectionRequirements();
      const chainConfig = this.coreOptions.chainConfigs.find((x) => x.chainId === chainId);
      if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: this.name });

      const chainName = getSolanaChainByChainConfig(chainConfig);
      if (!this.wallet.chains.find((chain) => chain === chainName))
        throw WalletLoginError.connectionError(`Chain ${chainName} not supported. Supported chains are ${this.wallet.chains.join(", ")}`);

      if (!this.isWalletConnected) {
        await this.wallet.features[StandardConnect].connect();
      }
      if (this.wallet.accounts.length === 0) throw WalletLoginError.connectionError();

      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: this.name, reconnected: this.rehydrated, provider: this.provider } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error: unknown) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = false;
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
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
      this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.disconnectionError((error as Error)?.message) as Web3AuthError);
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.isWalletConnected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.injectedProvider?.switchChain(params);
  }

  async enableMFA(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

export const walletStandardAdapter = (params: { name: string; wallet: Wallet }): AdapterFn => {
  const { name, wallet } = params;
  return ({ coreOptions }: AdapterParams) => {
    return new WalletStandardAdapter({
      name,
      wallet,
      coreOptions,
    });
  };
};
