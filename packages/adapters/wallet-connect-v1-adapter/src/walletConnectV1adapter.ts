import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterNamespaceType,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  getChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import log from "loglevel";

import { defaultWalletConnectV1Options } from "./config";
import { WalletConnectV1AdapterOptions } from "./interface";

// TODO: Move to using standalone client with our jrpc provider instead of @walletconnect/web3-provider
class WalletConnectV1Adapter extends BaseAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.WALLET_CONNECT_V1;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly adapterOptions: WalletConnectV1AdapterOptions;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider: SafeEventEmitterProvider | null = null;

  public adapterData: WalletConnectV1Data = {
    uri: "",
  };

  public walletConnectProvider: WalletConnectProvider | null = null;

  private rehydrated = false;

  constructor(options: WalletConnectV1AdapterOptions = {}) {
    super();
    this.adapterOptions = { ...defaultWalletConnectV1Options, ...options };
    this.chainConfig = options.chainConfig;
  }

  get connected(): boolean {
    return this.walletConnectProvider?.connected || false;
  }

  async init(): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
    }
    // Create a connector
    this.walletConnectProvider = new WalletConnectProvider({
      ...this.adapterOptions.adapterSettings,
      qrcode: false,
    });
    if (this.walletConnectProvider.connected) {
      this.provider = this.walletConnectProvider as unknown as SafeEventEmitterProvider;
      this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      if (!this.walletConnectProvider) {
        this.emit(ADAPTER_STATUS.ERRORED, WalletLoginError.connectionError("Failed to setup wallet connect qr code"));
        return;
      }
      this.walletConnectProvider.connector.on("display_uri", async (err, payload) => {
        if (err) {
          this.emit(ADAPTER_STATUS.ERRORED, WalletLoginError.connectionError("Failed to display wallet connect qr code"));
          return;
        }
        const uri = payload.params[0];
        this.adapterData = {
          ...this.adapterData,
          uri,
        };
        this.emit(ADAPTER_STATUS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
        this.status = ADAPTER_STATUS.READY;
        resolve();
      });

      this.walletConnectProvider.enable().catch((error) => {
        this.emit(ADAPTER_STATUS.ERRORED, error);
        reject(error);
      });
    });
  }

  // intentionally not emitting or setting connecting here
  async connect(): Promise<void> {
    super.checkConnectionRequirements();
    if (!this.walletConnectProvider) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    try {
      this.subscribeEvents(this.walletConnectProvider);
    } catch (error) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_STATUS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with wallet connect");
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.walletConnectProvider) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.walletConnectProvider.disconnect();
    this.emit(ADAPTER_STATUS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  setAdapterSettings(_: unknown): void {}

  private subscribeEvents(provider: WalletConnectProvider): void {
    // Subscribe to session connection
    provider.on("connect", (error: Error, payload: { params: { accounts: string[]; chainId: string }[] }) => {
      if (error) {
        this.emit(ADAPTER_STATUS.ERRORED, error);
        return;
      }
      const { chainId } = payload.params[0];
      if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
        this.emit(
          ADAPTER_STATUS.ERRORED,
          WalletInitializationError.invalidNetwork(
            `Not connected to correct chainId. Expected: ${(this.chainConfig as CustomChainConfig).chainId}, Current: ${chainId}`
          )
        );
        return;
      }
      this.provider = provider as unknown as SafeEventEmitterProvider;
      this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code: number, reason: string) => {
      log.debug("wallet connect, disconnected", code, reason);
      this.provider = null;
      this.walletConnectProvider = null;
      this.rehydrated = false;
      // ready to connect again
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_STATUS.DISCONNECTED);
    });

    provider.on("session_update", async (error: Error) => {
      if (error) {
        this.emit(ADAPTER_STATUS.ERRORED, error);
      }
    });
  }
}

export { WalletConnectV1Adapter };
