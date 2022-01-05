import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_ADAPTER_EVENTS,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import log from "loglevel";

import { defaultWalletConnectV1Options } from "./config";
import type { WalletConnectV1AdapterOptions } from "./interface";

class WalletConnectV1Adapter extends BaseAdapter<void> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly adapterOptions: WalletConnectV1AdapterOptions;

  public connecting = false;

  public ready = false;

  public provider!: SafeEventEmitterProvider | undefined;

  public adapterData: WalletConnectV1Data = {
    uri: "",
  };

  public walletConnectProvider!: WalletConnectProvider | undefined;

  constructor(options: WalletConnectV1AdapterOptions) {
    super();
    this.adapterOptions = { ...defaultWalletConnectV1Options, ...options };
  }

  get connected(): boolean {
    return this.walletConnectProvider ? this.walletConnectProvider.connected : false;
  }

  async init(): Promise<void> {
    if (this.ready) return;
    // Create a connector
    this.walletConnectProvider = new WalletConnectProvider({
      ...this.adapterOptions.adapterSettings,
      qrcode: false,
    });
    return new Promise((resolve) => {
      (this.walletConnectProvider as WalletConnectProvider).connector.on("display_uri", async (err, payload) => {
        if (err) {
          this.emit(BASE_ADAPTER_EVENTS.ERRORED, WalletLoginError.connectionError("Failed to display wallet connect qr code"));
          return;
        }
        const uri = payload.params[0];
        this.adapterData = {
          ...this.adapterData,
          uri,
        };
        this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
        this.ready = true;
        resolve();
      });
      (this.walletConnectProvider as WalletConnectProvider).enable();
      if ((this.walletConnectProvider as WalletConnectProvider).connected) {
        this.provider = this.walletConnectProvider as unknown as SafeEventEmitterProvider;
        this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.WALLET_CONNECT_V1);
        resolve();
      }
    });
  }

  // intentionally not emitting or setting connecting here
  async connect(): Promise<void> {
    if (!this.ready || !this.walletConnectProvider) throw WalletInitializationError.notReady("Wallet connect adapter is not ready");
    if (this.walletConnectProvider.connected) {
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.WALLET_CONNECT_V1);
      return;
    }
    try {
      this.subscribeEvents(this.walletConnectProvider);
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with wallet connect");
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.walletConnectProvider) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.walletConnectProvider.disconnect();
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  setChainConfig(_: CustomChainConfig): void {}

  setAdapterSettings(_: unknown): void {}

  private subscribeEvents(provider: WalletConnectProvider): void {
    // Subscribe to session connection
    provider.on("connect", () => {
      this.provider = provider as unknown as SafeEventEmitterProvider;
      this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.WALLET_CONNECT_V1);
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code: number, reason: string) => {
      log.debug("wallet connect, disconnected", code, reason);
      this.provider = undefined;
      this.walletConnectProvider = undefined;
      this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
    });
  }
}

export { WalletConnectV1Adapter };
