import WalletConnect from "@walletconnect/client";
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
  log,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";
import { WalletConnectProvider } from "@web3auth/ethereum-provider";

import { WALLET_CONNECT_EXTENSION_ADAPTERS } from "./config";
import { WalletConnectV1AdapterOptions } from "./interface";

class WalletConnectV1Adapter extends BaseEvmAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.WALLET_CONNECT_V1;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly adapterOptions: WalletConnectV1AdapterOptions;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public adapterData: WalletConnectV1Data = {
    uri: "",
    extensionAdapters: WALLET_CONNECT_EXTENSION_ADAPTERS,
  };

  public connector: WalletConnect | null = null;

  private wcProvider: WalletConnectProvider | null = null;

  constructor(options: WalletConnectV1AdapterOptions = {}) {
    super(options);
    this.adapterOptions = { ...options };
  }

  get connected(): boolean {
    return !!this.connector?.connected;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.wcProvider?.provider || null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions = {}): Promise<void> {
    await super.init();
    super.checkInitializationRequirements();
    // Create a connector
    this.connector = this.getWalletConnectInstance();
    this.wcProvider = new WalletConnectProvider({ config: { chainConfig: this.chainConfig as CustomChainConfig }, connector: this.connector });

    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
    this.status = ADAPTER_STATUS.READY;
    log.debug("initializing wallet connect v1 adapter");
    if (options.autoConnect) {
      if (this.connected) {
        try {
          this.rehydrated = true;
          await this.onConnectHandler({ accounts: this.connector.accounts, chainId: this.connector.chainId });
        } catch (error) {
          log.error("wallet auto connect", error);
          this.emit(ADAPTER_EVENTS.ERRORED, error);
        }
      } else {
        this.status = ADAPTER_STATUS.NOT_READY;
        this.emit(ADAPTER_EVENTS.CACHE_CLEAR);
      }
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");

    if (this.connected) {
      await this.onConnectHandler({ accounts: this.connector.accounts, chainId: this.connector.chainId });
      return this.provider;
    }

    if (this.status !== ADAPTER_STATUS.CONNECTING) {
      // for wallet connect qr code modal we have to create a new connector, coz wallet connect internally does not open
      // modal again on existing instance if connection is pending.
      if (this.adapterOptions.adapterSettings?.qrcodeModal) {
        this.connector = this.getWalletConnectInstance();
        this.wcProvider = new WalletConnectProvider({
          config: {
            chainConfig: this.chainConfig as CustomChainConfig,
            // network switching can be skipped with custom ui
            skipLookupNetwork: this.adapterOptions.adapterSettings?.skipNetworkSwitching,
          },
          connector: this.connector,
        });
      }
      await this.createNewSession();
      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1 });
    }
    return new Promise((resolve, reject) => {
      if (!this.connector) {
        reject(WalletInitializationError.notReady("Wallet adapter is not ready yet"));
        return;
      }
      // for wallet connect default modal.
      this.connector.on("modal_closed", async () => {
        this.status = ADAPTER_STATUS.READY;
        this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
        return reject(new Error("User closed modal"));
      });
      try {
        // Subscribe to session connection
        this.connector.on("connect", async (error: Error | null, payload: { params: { accounts: string[]; chainId: number }[] }) => {
          if (error) {
            this.emit(ADAPTER_EVENTS.ERRORED, error);
          }
          log.debug("connected event emitted by web3auth");
          await this.onConnectHandler(payload.params[0]);
          return resolve(this.provider);
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
    await super.disconnectSession();
    const { cleanup } = options;
    if (!this.connector || !this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.connector.killSession();
    this.rehydrated = false;
    if (cleanup) {
      this.connector = null;
      this.status = ADAPTER_STATUS.NOT_READY;
      this.wcProvider = null;
    } else {
      // ready to connect again
      this.status = ADAPTER_STATUS.READY;
    }
    await super.disconnect();
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(init);
    const networkSwitch = this.adapterOptions.adapterSettings?.networkSwitchModal;
    if (networkSwitch) {
      await networkSwitch.addNetwork({ chainConfig, appOrigin: window.location.hostname });
    }
    await this.wcProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this._switchChain({ chainId: params.chainId }, this.chainConfig as CustomChainConfig);
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  private async _switchChain(connectedChainConfig: Partial<CustomChainConfig>, chainConfig: CustomChainConfig): Promise<void> {
    const networkSwitch = this.adapterOptions.adapterSettings?.networkSwitchModal;

    if (networkSwitch) {
      await networkSwitch.switchNetwork({
        currentChainConfig: chainConfig,
        newChainConfig: connectedChainConfig,
        appOrigin: window.location.hostname,
      });
    }
    await this.wcProvider?.switchChain({ chainId: chainConfig.chainId, lookup: false, addChain: false });
  }

  private async createNewSession(opts: { forceNewSession: boolean } = { forceNewSession: false }): Promise<void> {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    if (opts.forceNewSession && this.connector.pending) {
      await this.connector.killSession();
    }
    // for wallet connect qr modal
    if (this.adapterOptions?.adapterSettings?.qrcodeModal) {
      await this.connector.createSession({ chainId: parseInt(this.chainConfig?.chainId || "0x1", 16) });
      return;
    }

    // for web3auth qr code modal
    return new Promise<void>((resolve, reject) => {
      if (!this.connector) {
        reject(WalletInitializationError.notReady("Wallet adapter is not ready yet"));
        return;
      }
      log.debug("creating new session for web3auth wallet connect");
      this.connector.on("display_uri", async (err, payload) => {
        if (err) {
          this.emit(ADAPTER_EVENTS.ERRORED, WalletLoginError.connectionError("Failed to display wallet connect qr code"));
          return reject(err);
        }
        const uri = payload.params[0];
        this.updateAdapterData({ uri, extensionAdapters: WALLET_CONNECT_EXTENSION_ADAPTERS } as WalletConnectV1Data);

        this.connector?.off("display_uri");
        return resolve();
      });

      this.connector.createSession({ chainId: parseInt(this.chainConfig?.chainId || "0x1", 16) }).catch((error) => {
        log.error("error while creating new wallet connect session", error);
        this.emit(ADAPTER_EVENTS.ERRORED, error);
        return reject(error);
      });
    });
  }

  private async onConnectHandler(params: { accounts: string[]; chainId: number }) {
    if (!this.connector || !this.wcProvider) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("Chain config is not set");

    const { chainId } = params;
    log.debug("connected chainId in hex");
    // This is to check if the connected wallet can return chainId
    // in string or a number format.
    let isDifferentChain = false;
    if (typeof chainId === "string") {
      isDifferentChain = chainId !== this.chainConfig.chainId;
    } else if (typeof chainId === "number") {
      isDifferentChain = chainId !== parseInt(this.chainConfig.chainId, 16);
    }
    if (isDifferentChain) {
      const connectedChainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, chainId) || {
        chainId: typeof chainId === "number" ? `0x${chainId.toString(16)}` : chainId,
        displayName: "Unknown Network",
      };

      const isCustomUi = this.adapterOptions.adapterSettings?.qrcodeModal;
      // skipping network is not allowed in default ui. We are use network switching modal for default ui.
      if (!isCustomUi || (isCustomUi && !this.adapterOptions?.adapterSettings?.skipNetworkSwitching)) {
        try {
          await this.addChain(this.chainConfig, true);
          await this._switchChain(connectedChainConfig, this.chainConfig);
          this.connector = this.getWalletConnectInstance();
        } catch (error) {
          log.error("error while chain switching", error);
          // we need to create a new session since old session is already used and
          // user needs to login again with correct chain with new qr code.
          await this.createNewSession({ forceNewSession: true });
          this.emit(
            ADAPTER_EVENTS.ERRORED,
            WalletInitializationError.fromCode(
              5000,
              `Not connected to correct network. Expected: ${this.chainConfig.displayName}, Current: ${
                connectedChainConfig?.displayName || chainId
              }, Please switch to correct network from wallet`
            )
          );
          this.status = ADAPTER_STATUS.READY;
          this.rehydrated = true;
          return;
        }
      }
    }
    await this.wcProvider.setupProvider(this.connector);
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
    connector.on("disconnect", async (error: Error | null, _) => {
      if (error) {
        this.emit(ADAPTER_EVENTS.ERRORED, error);
      }
      log.debug("disconnect event emitted by web3auth");
      await super.disconnect();
      this.status = ADAPTER_EVENTS.READY;
    });
  }

  private getWalletConnectInstance(): WalletConnect {
    const walletConnectOptions = this.adapterOptions.adapterSettings || {};
    walletConnectOptions.bridge = walletConnectOptions.bridge || "https://bridge.walletconnect.org";
    // Create a connector
    return new WalletConnect(walletConnectOptions);
  }
}

export { WalletConnectV1Adapter };
