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
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";
import { FarcasterAuthClientProvider } from "@web3auth/ethereum-provider";

export class FarcasterAdapter extends BaseEvmAdapter<void> {
  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_ADAPTERS.FARCASTER;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  fcProvider: FarcasterAuthClientProvider | null = null;

  userInfo: Partial<UserInfo> = {};

  // private farcasterStatus:;

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY && this.fcProvider) {
      return this.fcProvider;
    }
    return null;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    log.debug("initializing farcaster adapter");
    super.init(options);
    super.checkInitializationRequirements();
    this.fcProvider = new FarcasterAuthClientProvider({ config: { chainConfig: this.chainConfig } });

    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.FARCASTER);
    this.status = ADAPTER_STATUS.READY;
  }

  async connect(): Promise<IProvider> {
    super.checkConnectionRequirements();
    if (!this.fcProvider) throw new Error("Not able to connect to farcaster");

    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.FARCASTER });

    log.debug("connection farcaster appclient");

    const chanResponse = await this.fcProvider.createChannel({
      siweUri: "https://example.com/login",
      domain: "example.com",
    });
    log.debug("farcaster channel response", chanResponse);
    if (chanResponse.url) {
      this.updateAdapterData({ farcasterConnectUri: chanResponse.url, farcasterLogin: true });
    }

    const fcStatus = await this.fcProvider.watchStatus({ channelToken: chanResponse.channelToken });
    log.debug("status", fcStatus);
    this.userInfo = fcStatus.data as Partial<UserInfo>;
    // const s = fcStatus.data

    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.FARCASTER });
    return this.provider;
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.fcProvider?.removeAllListeners();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.fcProvider = null;
    } else {
      this.status = ADAPTER_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) {
      throw new Error("Noted connected with farcaster. Please login/connect first");
    }
    log.debug("farcasterAdapter::getUserInfo", this.fcProvider.status);
    return this.fcProvider.status as Partial<UserInfo>;
  }

  addChain(_chainConfig: CustomChainConfig): Promise<void> {
    throw new Error("Method not implemented.");
  }

  switchChain(_params: { chainId: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
