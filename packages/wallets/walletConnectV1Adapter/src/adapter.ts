import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletConnectV1Data,
  WalletNotConnectedError,
  WalletNotReadyError,
} from "@web3auth/base";
import log from "loglevel";

class WalletConnectV1Adapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  public connecting: boolean;

  public ready: boolean;

  public provider: SafeEventEmitterProvider;

  public connected: boolean;

  public adapterData: WalletConnectV1Data = {
    uri: "",
  };

  private walletConnectProvider: WalletConnectProvider;

  async init(options: { connect: boolean }): Promise<void> {
    if (this.ready) return;
    return new Promise((resolve) => {
      // Create a connector
      this.walletConnectProvider = new WalletConnectProvider({
        infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
        qrcode: false,
      });
      this.walletConnectProvider.connector.on("display_uri", async (err, payload) => {
        if (err) {
          throw new WalletConnectionError("Failed to display wallet connect qr code", err);
        }
        const uri = payload.params[0];
        this.adapterData = {
          ...this.adapterData,
          uri,
        };

        this.ready = true;
        this.emit(BASE_WALLET_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
        try {
          if (options.connect) {
            await this.connect();
          }
        } catch (error) {
          this.emit(BASE_WALLET_EVENTS.ERRORED, error);
        } finally {
          resolve();
        }
      });
      this.walletConnectProvider.enable();
    });
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    return new Promise((resolve) => {
      if (!this.ready) throw new WalletNotReadyError("Wallet connect adapter is not ready");
      this.connecting = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTING);
      try {
        const onConnectHandler = () => {
          this.walletConnectProvider.removeListener("connect", onConnectHandler);
          this.provider = this.walletConnectProvider as unknown as SafeEventEmitterProvider;
          this.subscribeEvents(this.provider);
          this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.WALLET_CONNECT_V1);
          resolve(this.provider);
        };
        this.walletConnectProvider.on("connect", onConnectHandler);
      } catch (error) {
        this.emit(BASE_WALLET_EVENTS.ERRORED, error);
        throw new WalletConnectionError("Failed to login with wallet connect", error);
      } finally {
        this.connecting = false;
      }
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet");
    this.provider = undefined;
    this.walletConnectProvider = undefined;
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private subscribeEvents(provider: SafeEventEmitterProvider): void {
    // Subscribe to session connection
    provider.on("connect", () => {
      this.connected = true;
      this.provider = provider;
      this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.WALLET_CONNECT_V1);
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code: number, reason: string) => {
      log.debug("wallet connect, disconnected", code, reason);
      this.provider = undefined;
      this.walletConnectProvider = undefined;
      this.connected = false;
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
    });
  }
}

export { WalletConnectV1Adapter };
