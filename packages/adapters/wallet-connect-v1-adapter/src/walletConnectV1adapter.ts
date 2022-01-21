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
  isHexStrict,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { WalletConnectProvider } from "@web3auth/ethereum-provider";
import log from "loglevel";

import { defaultWalletConnectV1Options } from "./config";
import { WalletConnectV1AdapterOptions } from "./interface";

class WalletConnectV1Adapter extends BaseAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.WALLET_CONNECT_V1;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly adapterOptions: WalletConnectV1AdapterOptions;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public adapterData: WalletConnectV1Data = {
    uri: "",
  };

  public connector: WalletConnect | null = null;

  private wcProviderFactory: WalletConnectProvider | null = null;

  private rehydrated = false;

  constructor(options: WalletConnectV1AdapterOptions = {}) {
    super();
    this.adapterOptions = { ...defaultWalletConnectV1Options, ...options };
    this.chainConfig = options.chainConfig;
  }

  get connected(): boolean {
    return !!this.connector?.connected;
  }

  get provider(): SafeEventEmitterProvider | null {
    if (this.status === ADAPTER_STATUS.CONNECTED && this.wcProviderFactory) {
      return this.wcProviderFactory.provider;
    }
    return null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
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
    this.wcProviderFactory = new WalletConnectProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig } });

    if (this.connector.connected) {
      this.rehydrated = true;
      await this.onConnectHandler({ accounts: this.connector.accounts, chainId: this.connector.chainId.toString() });
      return;
    }
    await this.createNewSession();
  }

  // intentionally not emitting or setting connecting here
  // this should be called immediately after displaying qr code.
  async connect(): Promise<void> {
    super.checkConnectionRequirements();
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");

    if (this.connected) {
      await this.onConnectHandler({ accounts: this.connector.accounts, chainId: this.connector.chainId.toString() });
    }

    return new Promise((resolve, reject) => {
      if (!this.connector) return reject(WalletInitializationError.notReady("Wallet adapter is not ready yet"));

      try {
        // Subscribe to session connection
        this.connector.on("connect", async (error: Error | null, payload: { params: { accounts: string[]; chainId: string }[] }) => {
          if (error) {
            this.emit(ADAPTER_EVENTS.ERRORED, error);
          }
          await this.onConnectHandler(payload.params[0]);
          return resolve();
        });
      } catch (error: unknown) {
        log.error("Wallet connect v1 adapter error while connecting", error);
        // ready again to be connected
        this.status = ADAPTER_STATUS.READY;
        this.rehydrated = true;
        this.emit(ADAPTER_EVENTS.ERRORED, error);
        reject(
          error instanceof Web3AuthError
            ? error
            : WalletLoginError.connectionError(`Failed to login with wallet connect: ${(error as Error)?.message || ""}`)
        );
      }
    });
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    const { cleanup } = options;
    if (!this.connector || !this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.connector.killSession();
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
  }

  private async createNewSession() {
    return new Promise<void>((resolve, reject) => {
      if (!this.connector) return reject(WalletInitializationError.notReady("Wallet adapter is not ready yet"));

      this.connector.on("display_uri", async (err, payload) => {
        if (err) {
          this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.connectionError("Failed to display wallet connect qr code"));
          return reject(err);
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
        return reject(error);
      });
    });
  }

  private async onConnectHandler(params: { accounts: string[]; chainId: string }) {
    if (!this.connector || !this.wcProviderFactory) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("Chain config is not set");

    const { chainId } = params;
    log.debug("connected chainId", chainId);
    const connectedChainId = parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
    if (connectedChainId !== parseInt(this.chainConfig.chainId, 16)) {
      // we need to create a new session since old session is already used and
      // user needs to login again with correct chain with new qr code.
      await this.connector.killSession();
      await this.createNewSession();
      this.emit(
        ADAPTER_EVENTS.ERRORED,
        WalletInitializationError.fromCode(
          5000,
          `Not connected to correct chainId. Expected: ${this.chainConfig.chainId}, Current: ${connectedChainId}, Please switch to correct chain from wallet`
        )
      );
      return;
    }
    await this.wcProviderFactory.setupProvider(this.connector);
    this.subscribeEvents(this.connector);
    this.status = ADAPTER_STATUS.CONNECTED;
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
