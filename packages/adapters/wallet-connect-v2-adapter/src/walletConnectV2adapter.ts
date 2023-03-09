import SignClient from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import { getSdkError, isValidArray } from "@walletconnect/utils";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterNamespaceType,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  log,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectV2Data,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";
import { WalletConnectV2Provider } from "@web3auth/ethereum-provider";

import { WALLET_CONNECT_EXTENSION_ADAPTERS } from "./config";
import { WalletConnectV2AdapterOptions } from "./interface";
import { supportsAddChainRpc, supportsSwitchChainRpc } from "./utils";

class WalletConnectV2Adapter extends BaseEvmAdapter<void> {
  readonly name: string = WALLET_ADAPTERS.WALLET_CONNECT_V2;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly adapterOptions: WalletConnectV2AdapterOptions;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public adapterData: WalletConnectV2Data = {
    uri: "",
    extensionAdapters: WALLET_CONNECT_EXTENSION_ADAPTERS,
  };

  public connector: SignClient | null = null;

  public activeSession: SessionTypes.Struct | null = null;

  private wcProvider: WalletConnectV2Provider | null = null;

  constructor(options: WalletConnectV2AdapterOptions = {}) {
    super(options);
    this.adapterOptions = { ...options };
  }

  get connected(): boolean {
    return !!this.activeSession;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.wcProvider?.provider || null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(): Promise<void> {
    await super.init();
    super.checkInitializationRequirements();
    // Create a connector
    const { adapterSettings } = this.adapterOptions;
    this.connector = await SignClient.init(adapterSettings?.walletConnectInitOptions);
    this.wcProvider = new WalletConnectV2Provider({ config: { chainConfig: this.chainConfig as CustomChainConfig }, connector: this.connector });

    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V2);
    this.status = ADAPTER_STATUS.READY;
    log.debug("initializing wallet connect v2 adapter");
    await this.checkForPersistedSession();
    if (this.connected) {
      this.rehydrated = true;
      await this.onConnectHandler();
    }
  }

  async connect(): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    try {
      // if already connected
      if (this.connected) {
        await this.onConnectHandler();
        return this.provider;
      }

      if (this.status !== ADAPTER_STATUS.CONNECTING) {
        await this.createNewSession();
      }
      return this.provider;
    } catch (error) {
      log.error("Wallet connect v2 adapter error while connecting", error);
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.rehydrated = true;
      this.emit(ADAPTER_EVENTS.ERRORED, error);

      const finalError =
        error instanceof Web3AuthError
          ? error
          : WalletLoginError.connectionError(`Failed to login with wallet connect: ${(error as Error)?.message || ""}`);
      throw finalError;
    }
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(init);
    if (!supportsAddChainRpc(this.adapterOptions.chainConfig as CustomChainConfig, this.adapterOptions.loginSettings)) {
      throw WalletInitializationError.invalidParams("Please add `wallet_addEthereumChain` method in your namespace to use addChain method");
    }
    const networkSwitch = this.adapterOptions.adapterSettings?.networkSwitchModal;
    if (networkSwitch) {
      await networkSwitch.addNetwork({ chainConfig, appOrigin: window.location.hostname });
    }
    await this.wcProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    if (!supportsSwitchChainRpc(this.adapterOptions.chainConfig as CustomChainConfig, this.adapterOptions.loginSettings)) {
      throw WalletInitializationError.invalidParams("Please add `wallet_switchEthereumChain` method in your namespace to use switchChain method");
    }
    await this._switchChain({ chainId: params.chainId }, this.chainConfig as CustomChainConfig);
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    const { cleanup } = options;
    if (!this.connector || !this.connected || !this.activeSession?.topic) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.connector.disconnect({ topic: this.activeSession?.topic, reason: getSdkError("USER_DISCONNECTED") });
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

  private cleanupPendingPairings(): void {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    const inactivePairings = this.connector.pairing.getAll({ active: false });

    if (!isValidArray(inactivePairings)) return;

    inactivePairings.forEach((pairing) => {
      if (this.connector) {
        this.connector.pairing.delete(pairing.topic, getSdkError("USER_DISCONNECTED"));
      }
    });
  }

  private async checkForPersistedSession(): Promise<SessionTypes.Struct | null> {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    if (this.connector.session.length) {
      const lastKeyIndex = this.connector.session.keys.length - 1;
      this.activeSession = this.connector.session.get(this.connector.session.keys[lastKeyIndex]);
    }
    return this.activeSession;
  }

  private async createNewSession(opts: { forceNewSession: boolean } = { forceNewSession: false }): Promise<void> {
    try {
      if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
      if (!this.adapterOptions.loginSettings) throw WalletInitializationError.notReady("login settings are not set yet");

      this.status = ADAPTER_STATUS.CONNECTING;
      this.emit(ADAPTER_EVENTS.CONNECTING, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V2 });
      if (opts.forceNewSession && this.activeSession?.topic) {
        await this.connector.disconnect({ topic: this.activeSession?.topic, reason: getSdkError("USER_DISCONNECTED") });
      }

      log.debug("creating new session for web3auth wallet connect");
      const { uri, approval } = await this.connector.connect(this.adapterOptions.loginSettings);
      const qrcodeModal = this.adapterOptions?.adapterSettings?.qrcodeModal;
      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        if (qrcodeModal) {
          qrcodeModal.open(uri, () => {
            // eslint-disable-next-line no-console
            console.log("EVENT", "QR Code Modal closed");
          });
        } else {
          this.updateAdapterData({ uri, extensionAdapters: WALLET_CONNECT_EXTENSION_ADAPTERS } as WalletConnectV2Data);
        }
      }

      // Await session approval from the wallet.
      const session = await approval();
      this.activeSession = session;
      // Handle the returned session (e.g. update UI to "connected" state).
      await this.onConnectHandler();
      if (qrcodeModal) {
        qrcodeModal.close();
      }
    } catch (error) {
      log.error("error while creating new wallet connect session", error);
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      throw error;
    }
  }

  private async onConnectHandler() {
    if (!this.connector || !this.wcProvider) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("Chain config is not set");
    if (this.adapterOptions.adapterSettings?.qrcodeModal) {
      this.wcProvider = new WalletConnectV2Provider({
        config: {
          chainConfig: this.chainConfig as CustomChainConfig,
          // network switching can be skipped with custom ui
          skipLookupNetwork: this.adapterOptions.adapterSettings?.skipNetworkSwitching,
        },
        connector: this.connector,
      });
    }
    await this.wcProvider.setupProvider(this.connector);
    this.subscribeEvents();
    this.cleanupPendingPairings();
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V2, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
  }

  private subscribeEvents(): void {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet adapter is not ready yet");

    this.connector.on("session_update", ({ topic, params }) => {
      if (!this.connector) return;
      const { namespaces } = params;
      const _session = this.connector.session.get(topic);
      // Overwrite the `namespaces` of the existing session with the incoming one.
      const updatedSession = { ..._session, namespaces };
      // Integrate the updated session state into your dapp state.
      this.activeSession = updatedSession;
    });

    this.connector.events.on("session_delete", () => {
      // Session was deleted -> reset the dapp state, clean up from user session, etc.
    });
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
    await this.wcProvider?.switchChain({ chainId: chainConfig.chainId });
  }
}

export { WalletConnectV2Adapter };
