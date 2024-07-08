import Client from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import { getSdkError, isValidArray } from "@walletconnect/utils";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CONNECTOR_CATEGORY,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  ConnectorInitOptions,
  ConnectorNamespaceType,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WALLET_CONNECTORS,
  WalletConnectData,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmConnector } from "@web3auth/base-evm-connector";
import merge from "lodash.merge";

import { getWalletConnectSettings, WALLET_CONNECT_EXTENSION_CONNECTORS } from "./config";
import { WalletConnectConnectorOptions } from "./interface";
import { WalletConnectProvider } from "./WalletConnectProvider";

export class WalletConnectConnector extends BaseEvmConnector<void> {
  readonly name: string = WALLET_CONNECTORS.WALLET_CONNECT_V2;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  connectorOptions: WalletConnectConnectorOptions = {};

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public connectorData: WalletConnectData = {
    uri: "",
    extensionConnector: WALLET_CONNECT_EXTENSION_CONNECTORS,
  };

  public connector: Client | null = null;

  public activeSession: SessionTypes.Struct | null = null;

  private wcProvider: WalletConnectProvider | null = null;

  constructor(options: WalletConnectConnectorOptions = {}) {
    super(options);
    this.connectorOptions = { ...options };
    this.setConnectorSettings(options);
  }

  get connected(): boolean {
    return !!this.activeSession;
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.wcProvider) {
      return this.wcProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    await super.init();
    super.checkInitializationRequirements();
    const projectId = this.connectorOptions.connectorSettings?.walletConnectInitOptions?.projectId;
    if (!projectId) {
      throw WalletInitializationError.invalidParams("Wallet connect project id is required in wallet connect v2 connector");
    }

    const wc2Settings = await getWalletConnectSettings(
      this.chainConfig?.chainNamespace as ChainNamespaceType,
      [this.chainConfig?.id?.toString(16)],
      projectId
    );
    if (!this.connectorOptions.loginSettings || Object.keys(this.connectorOptions.loginSettings).length === 0) {
      this.connectorOptions.loginSettings = wc2Settings.loginSettings;
    }

    this.connectorOptions.connectorSettings = merge(wc2Settings.connectorSettings, this.connectorOptions.connectorSettings);

    const { connectorSettings } = this.connectorOptions;
    this.connector = await Client.init(connectorSettings?.walletConnectInitOptions);
    this.wcProvider = new WalletConnectProvider({
      config: { chainConfig: this.chainConfig as CustomChainConfig },
      connector: this.connector,
    });

    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.WALLET_CONNECT_V2);
    this.status = CONNECTOR_STATUS.READY;
    log.debug("initializing wallet connect v2 connector");
    if (options.autoConnect) {
      await this.checkForPersistedSession();

      if (this.connected) {
        this.rehydrated = true;
        try {
          await this.onConnectHandler();
        } catch (error) {
          log.error("wallet auto connect", error);
          this.emit(CONNECTOR_EVENTS.ERRORED, error);
        }
      } else {
        this.status = CONNECTOR_STATUS.NOT_READY;
        this.emit(CONNECTOR_EVENTS.CACHE_CLEAR);
      }
    }
  }

  async connect(): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");
    try {
      // if already connected
      if (this.connected) {
        await this.onConnectHandler();
        return this.provider;
      }

      if (this.status !== CONNECTOR_STATUS.CONNECTING) {
        await this.createNewSession();
      }
      return this.provider;
    } catch (error) {
      log.error("Wallet connect v2 connector error while connecting", error);
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = true;
      this.emit(CONNECTOR_EVENTS.ERRORED, error);

      const finalError =
        error instanceof Web3AuthError
          ? error
          : WalletLoginError.connectionError(`Failed to login with wallet connect: ${(error as Error)?.message || ""}`);
      throw finalError;
    }
  }

  // should be called only before initialization.
  setConnectorSettings(options: Partial<WalletConnectConnectorOptions>): void {
    super.setConnectorSettings(options);
    const { qrcodeModal, walletConnectInitOptions } = options?.connectorSettings || {};

    this.connectorOptions = {
      ...this.connectorOptions,
      connectorSettings: this.connectorOptions?.connectorSettings ?? {},
      loginSettings: this.connectorOptions?.loginSettings ?? {},
    };

    if (qrcodeModal) this.connectorOptions.connectorSettings.qrcodeModal = qrcodeModal;
    if (walletConnectInitOptions)
      this.connectorOptions.connectorSettings.walletConnectInitOptions = {
        ...(this.connectorOptions.connectorSettings.walletConnectInitOptions ?? {}),
        ...walletConnectInitOptions,
      };

    const { loginSettings } = options;
    if (loginSettings) this.connectorOptions.loginSettings = { ...(this.connectorOptions.loginSettings || {}), ...loginSettings };
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    await this.wcProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.wcProvider?.switchChain({ chainId: params.chainId });
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
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
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.wcProvider = null;
    } else {
      // ready to connect again
      this.status = CONNECTOR_STATUS.READY;
    }
    this.activeSession = null;
    await super.disconnect();
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  private cleanupPendingPairings(): void {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");
    const inactivePairings = this.connector.pairing.getAll({ active: false });

    if (!isValidArray(inactivePairings)) return;

    inactivePairings.forEach((pairing) => {
      if (this.connector) {
        this.connector.pairing.delete(pairing.topic, getSdkError("USER_DISCONNECTED"));
      }
    });
  }

  private async checkForPersistedSession(): Promise<SessionTypes.Struct | null> {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");
    if (this.connector.session.length) {
      const lastKeyIndex = this.connector.session.keys.length - 1;
      this.activeSession = this.connector.session.get(this.connector.session.keys[lastKeyIndex]);
    }
    return this.activeSession;
  }

  private async createNewSession(opts: { forceNewSession: boolean } = { forceNewSession: false }): Promise<void> {
    try {
      if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");

      if (!this.connectorOptions.loginSettings || Object.keys(this.connectorOptions.loginSettings).length === 0)
        throw WalletInitializationError.notReady("login settings are not set yet");

      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.WALLET_CONNECT_V2 });
      if (opts.forceNewSession && this.activeSession?.topic) {
        await this.connector.disconnect({ topic: this.activeSession?.topic, reason: getSdkError("USER_DISCONNECTED") });
      }

      log.debug("creating new session for web3auth wallet connect");
      const { uri, approval } = await this.connector.connect(this.connectorOptions.loginSettings);

      const qrcodeModal = this.connectorOptions?.connectorSettings?.qrcodeModal;
      // Open QRCode modal if a URI was returned (i.e. we're not connecting with an existing pairing).
      if (uri) {
        if (qrcodeModal) {
          try {
            await qrcodeModal.openModal({ uri });
            log.debug("EVENT", "QR Code Modal closed");
            this.status = CONNECTOR_STATUS.READY;
            this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.WALLET_CONNECT_V2);
          } catch (error) {
            log.error("unable to open qr code modal");
          }
        } else {
          this.updateConnectorData({ uri, extensionConnector: WALLET_CONNECT_EXTENSION_CONNECTORS } as WalletConnectData);
        }
      }

      log.info("awaiting session approval from wallet");

      // Await session approval from the wallet.
      const session = await approval();
      this.activeSession = session;
      // Handle the returned session (e.g. update UI to "connected" state).
      await this.onConnectHandler();
      if (qrcodeModal) {
        qrcodeModal.closeModal();
      }
    } catch (error: unknown) {
      if ((error as Error).message?.toLowerCase().includes("proposal expired")) {
        // Retry if connector status is still connecting
        log.info("current connector status: ", this.status);
        if (this.status === CONNECTOR_STATUS.CONNECTING) {
          log.info("retrying to create new wallet connect session since proposal expired");
          return this.createNewSession({ forceNewSession: true });
        }
        if (this.status === CONNECTOR_STATUS.READY) {
          log.info("ignoring proposal expired error since some other connector is connected");
          return;
        }
      }
      log.error("error while creating new wallet connect session", error);
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
      throw error;
    }
  }

  private async onConnectHandler() {
    if (!this.connector || !this.wcProvider) throw WalletInitializationError.notReady("Wallet connector is not ready yet");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("Chain config is not set");
    if (this.connectorOptions.connectorSettings?.qrcodeModal) {
      this.wcProvider = new WalletConnectProvider({
        config: {
          chainConfig: this.chainConfig as CustomChainConfig,
          skipLookupNetwork: true,
        },
        connector: this.connector,
      });
    }
    await this.wcProvider.setupProvider(this.connector);
    this.subscribeEvents();
    this.cleanupPendingPairings();
    this.status = CONNECTOR_STATUS.CONNECTED;
    this.emit(CONNECTOR_EVENTS.CONNECTED, {
      connector: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      reconnected: this.rehydrated,
      provider: this.provider,
    } as CONNECTED_EVENT_DATA);
  }

  private subscribeEvents(): void {
    if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");

    this.connector.events.on("session_update", ({ topic, params }) => {
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

      this.disconnect();
    });
  }
}
