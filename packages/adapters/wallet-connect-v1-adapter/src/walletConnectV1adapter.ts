import WalletConnect from "@walletconnect/client";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
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
import { WalletConnectProvider } from "@web3auth/ethereum-provider";

import { defaultWalletConnectV1Options } from "./config";
import { WalletConnectV1AdapterOptions } from "./interface";
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

  public connector: WalletConnect | null = null;

  private rehydrated = false;

  constructor(options: WalletConnectV1AdapterOptions = {}) {
    super();
    this.adapterOptions = { ...defaultWalletConnectV1Options, ...options };
    this.chainConfig = options.chainConfig;
  }

  get connected(): boolean {
    return !!this.connector?.connected;
  }

  async init(): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.chainConfig) {
      this.chainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, 1);
    }
    const walletConnectOptions = this.adapterOptions.adapterSettings || {};
    walletConnectOptions.bridge = walletConnectOptions.bridge || "https://bridge.walletconnect.org";
    // Create a connector
    this.connector = new WalletConnect(walletConnectOptions);
    if (this.connector.connected) {
      this.provider = this.connector as unknown as SafeEventEmitterProvider;
      this.rehydrated = true;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      if (!this.connector) {
        this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.connectionError("Failed to setup wallet connect qr code"));
        return;
      }
      this.createNewSession()
        .then(() => {
          return resolve();
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

  // intentionally not emitting or setting connecting here
  // this should be called immediately after displaying qr code.
  async connect(): Promise<void> {
    super.checkConnectionRequirements();
    return new Promise((resolve, reject) => {
      try {
        if (!this.connector) return reject(WalletInitializationError.notReady("Wallet adapter is not ready yet"));

        if (this.connected) {
          this.onConnectHandler({ accounts: this.connector.accounts, chainId: `0x${this.connector.chainId.toString(16)}` })
            .then(() => {
              return resolve();
            })
            .catch((err) => {
              return reject(err);
            });
        }
        const _handler = async (error: Error | null, payload: { params: { accounts: string[]; chainId: string }[] }) => {
          if (error) {
            this.emit(ADAPTER_EVENTS.ERRORED, error);
          }
          if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");

          await this.onConnectHandler(payload.params[0]);
          this.connector.off("connect");
          return resolve();
        };
        // Subscribe to session connection
        this.connector.on("connect", _handler);
        this.subscribeEvents(this.connector);
      } catch (error) {
        // ready again to be connected
        this.status = ADAPTER_STATUS.READY;
        this.rehydrated = true;
        this.emit(ADAPTER_EVENTS.ERRORED, error);
        reject(WalletLoginError.connectionError("Failed to login with wallet connect"));
      }
    });
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    const { cleanup } = options;
    return new Promise((resolve, reject) => {
      if (!this.connector || !this.connected) return reject(WalletLoginError.notConnectedError("Not connected with wallet"));
      this.connector
        .killSession()
        .then(async () => {
          this.provider = null;
          this.rehydrated = false;
          if (cleanup) {
            this.connector = null;
            this.status = ADAPTER_STATUS.NOT_READY;
          } else {
            await this.createNewSession();
            // ready to connect again
            this.status = ADAPTER_STATUS.READY;
          }
          this.emit(ADAPTER_EVENTS.DISCONNECTED);
          return resolve();
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  setAdapterSettings(_: unknown): void {}

  private async createNewSession() {
    return new Promise<void>((resolve, reject) => {
      if (!this.connector) return reject(WalletInitializationError.notReady("Wallet adapter is not ready yet"));

      this.connector.on("display_uri", async (err, payload) => {
        if (err) {
          this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.connectionError("Failed to display wallet connect qr code"));
          return;
        }
        const uri = payload.params[0];
        this.updateAdapterData({ uri } as WalletConnectV1Data);
        this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
        this.status = ADAPTER_STATUS.READY;
        this.connector?.off("display_uri");
        return resolve();
      });

      this.connector.createSession().catch((error) => {
        this.emit(ADAPTER_EVENTS.ERRORED, error);
        reject(error);
      });
    });
  }

  private async onConnectHandler(params: { accounts: string[]; chainId: string }) {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("Chain config is not set");

    const { chainId } = params;
    if (chainId !== (this.chainConfig as CustomChainConfig).chainId) {
      this.emit(
        ADAPTER_EVENTS.ERRORED,
        WalletInitializationError.fromCode(
          5000,
          `Not connected to correct chainId. Expected: ${(this.chainConfig as CustomChainConfig).chainId}, Current: ${chainId}`
        )
      );
      return;
    }
    const wcProviderFactory = new WalletConnectProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });
    this.provider = await wcProviderFactory.setupProvider(this.connector);
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
  }

  private subscribeEvents(connector: WalletConnect): void {
    connector.on("session_update", async (error: Error | null) => {
      if (error) {
        this.emit(ADAPTER_EVENTS.ERRORED, error);
      }
    });
  }
}

export { WalletConnectV1Adapter };
