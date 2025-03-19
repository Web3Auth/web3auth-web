import { signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";
import Client from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import { getSdkError, isValidArray } from "@walletconnect/utils";
import { EVM_METHOD_TYPES, SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";
import deepmerge from "deepmerge";

import {
  BaseConnector,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  checkIfTokenIsExpired,
  CONNECTED_EVENT_DATA,
  CONNECTOR_CATEGORY,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  ConnectorFn,
  ConnectorInitOptions,
  ConnectorNamespaceType,
  ConnectorParams,
  CustomChainConfig,
  getSavedToken,
  IProvider,
  log,
  saveToken,
  UserAuthInfo,
  UserInfo,
  WALLET_CONNECTORS,
  WalletConnectV2Data,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";

import { getWalletConnectV2Settings } from "./config";
import { IConnectorSettings, WalletConnectV2ConnectorOptions } from "./interface";
import { WalletConnectV2Provider } from "./WalletConnectV2Provider";

class WalletConnectV2Connector extends BaseConnector<void> {
  readonly name: string = WALLET_CONNECTORS.WALLET_CONNECT_V2;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.MULTICHAIN;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.OTHER;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  connectorOptions: WalletConnectV2ConnectorOptions;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public connectorData: WalletConnectV2Data = { uri: "" };

  public connector: Client | null = null;

  public activeSession: SessionTypes.Struct | null = null;

  private wcProvider: WalletConnectV2Provider | null = null;

  constructor(options: WalletConnectV2ConnectorOptions) {
    super(options);
    this.connectorOptions = { ...options };
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
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });

    const projectId = this.connectorOptions.connectorSettings?.walletConnectInitOptions?.projectId;
    if (!projectId) {
      throw WalletInitializationError.invalidParams("Wallet connect project id is required in wallet connect v2 connector");
    }

    const wc2Settings = await getWalletConnectV2Settings(this.coreOptions.chains, projectId);
    if (!this.connectorOptions.loginSettings || Object.keys(this.connectorOptions.loginSettings).length === 0) {
      this.connectorOptions.loginSettings = wc2Settings.loginSettings;
    }

    this.connectorOptions.connectorSettings = deepmerge(wc2Settings.connectorSettings || {}, this.connectorOptions.connectorSettings || {});
    const { connectorSettings } = this.connectorOptions;
    this.connector = await Client.init(connectorSettings?.walletConnectInitOptions);
    this.wcProvider = new WalletConnectV2Provider({
      config: { chain: chainConfig, chains: this.coreOptions.chains },
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
          await this.onConnectHandler({ chain: chainConfig });
        } catch (error) {
          log.error("wallet auto connect", error);
          this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
        }
      } else {
        this.status = CONNECTOR_STATUS.NOT_READY;
        this.emit(CONNECTOR_EVENTS.CACHE_CLEAR);
      }
    }
  }

  async connect({ chainId }: { chainId: string }): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");
    if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");

    try {
      // if already connected
      if (this.connected) {
        await this.onConnectHandler({ chain: chainConfig });
        return this.provider;
      }

      if (this.status !== CONNECTOR_STATUS.CONNECTING) {
        await this.createNewSession({ chainConfig });
      }
      return this.provider;
    } catch (error) {
      log.error("Wallet connect v2 connector error while connecting", error);
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = true;
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);

      const finalError =
        error instanceof Web3AuthError
          ? error
          : WalletLoginError.connectionError(`Failed to login with wallet connect: ${(error as Error)?.message || ""}`, error);
      throw finalError;
    }
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    if (!this.wcProvider) throw WalletInitializationError.notReady("Wallet Connect provider is not ready yet");
    try {
      await this.wcProvider.switchChain({ chainId: params.chainId });
    } catch (error) {
      log.error("error while switching chain", error);
      throw error;
    }
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  async disconnect(
    options: { cleanup?: boolean; sessionRemovedByWallet?: boolean } = { cleanup: false, sessionRemovedByWallet: false }
  ): Promise<void> {
    const { cleanup } = options;
    if (!this.connector || !this.connected || !this.activeSession?.topic) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!options.sessionRemovedByWallet)
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
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.provider || this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError();
    const { chainId } = this.provider;
    const currentChainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!currentChainConfig) throw WalletLoginError.connectionError("Chain config is not available");

    const { chainNamespace } = currentChainConfig;
    const accounts = await this.provider.request<never, string[]>({
      method: chainNamespace === CHAIN_NAMESPACES.EIP155 ? EVM_METHOD_TYPES.GET_ACCOUNTS : SOLANA_METHOD_TYPES.GET_ACCOUNTS,
    });
    if (accounts && accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0] as string, this.name);
      if (existingToken) {
        const isExpired = checkIfTokenIsExpired(existingToken);
        if (!isExpired) {
          return { idToken: existingToken };
        }
      }

      const payload = {
        domain: window.location.origin,
        uri: window.location.href,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace);
      const signedMessage = await this._getSignedMessage(challenge, accounts, chainNamespace);

      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage as string,
        challenge,
        this.name,
        this.coreOptions.sessionTime,
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork
      );
      saveToken(accounts[0] as string, this.name, idToken);
      return { idToken };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
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

  private async createNewSession({
    forceNewSession = false,
    chainConfig,
  }: {
    forceNewSession?: boolean;
    chainConfig: CustomChainConfig;
  }): Promise<void> {
    try {
      if (!this.connector) throw WalletInitializationError.notReady("Wallet connector is not ready yet");

      if (!this.connectorOptions.loginSettings || Object.keys(this.connectorOptions.loginSettings).length === 0)
        throw WalletInitializationError.notReady("login settings are not set yet");

      this.status = CONNECTOR_STATUS.CONNECTING;
      this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.WALLET_CONNECT_V2 });
      if (forceNewSession && this.activeSession?.topic) {
        await this.connector.disconnect({ topic: this.activeSession?.topic, reason: getSdkError("USER_DISCONNECTED") });
      }

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
          this.updateConnectorData({ uri } as WalletConnectV2Data);
        }
      }

      log.info("awaiting session approval from wallet");

      // Await session approval from the wallet.
      const session = await approval();
      this.activeSession = session;
      // Handle the returned session (e.g. update UI to "connected" state).
      await this.onConnectHandler({ chain: chainConfig });
      if (qrcodeModal) {
        qrcodeModal.closeModal();
      }
    } catch (error: unknown) {
      if ((error as Error).message?.toLowerCase().includes("proposal expired")) {
        // Retry if connector status is still connecting
        log.info("current connector status: ", this.status);
        if (this.status === CONNECTOR_STATUS.CONNECTING) {
          log.info("retrying to create new wallet connect session since proposal expired");
          return this.createNewSession({ forceNewSession: true, chainConfig });
        }
        if (this.status === CONNECTOR_STATUS.READY) {
          log.info("ignoring proposal expired error since some other connector is connected");
          return;
        }
      }
      log.error("error while creating new wallet connect session", error);
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      throw error;
    }
  }

  private async onConnectHandler({ chain }: { chain: CustomChainConfig }) {
    if (!this.connector || !this.wcProvider) throw WalletInitializationError.notReady("Wallet connect connector is not ready yet");
    this.subscribeEvents();
    if (this.connectorOptions.connectorSettings?.qrcodeModal) {
      this.wcProvider = new WalletConnectV2Provider({
        config: { chain, chains: this.coreOptions.chains, skipLookupNetwork: true },
        connector: this.connector,
      });
    }
    await this.wcProvider.setupProvider(this.connector);
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
      this.disconnect({ sessionRemovedByWallet: true });
    });
  }

  private async _getSignedMessage(challenge: string, accounts: string[], chainNamespace: ChainNamespaceType): Promise<string> {
    const signedMessage = await this.provider.request<string[] | { data: string }, string>({
      method: chainNamespace === CHAIN_NAMESPACES.EIP155 ? EVM_METHOD_TYPES.PERSONAL_SIGN : SOLANA_METHOD_TYPES.SIGN_MESSAGE,
      params: chainNamespace === CHAIN_NAMESPACES.EIP155 ? [challenge, accounts[0]] : { data: challenge },
    });
    return signedMessage;
  }
}

export const walletConnectV2Connector = (params?: IConnectorSettings): ConnectorFn => {
  return ({ projectConfig, coreOptions }: ConnectorParams) => {
    let { projectId } = params?.walletConnectInitOptions || {};

    // use project config if projectId is not set
    if (projectConfig) {
      const { wallet_connect_enabled: walletConnectEnabled, wallet_connect_project_id: walletConnectProjectId } = projectConfig;
      if (walletConnectEnabled && walletConnectProjectId && !projectId) projectId = walletConnectProjectId;
    }

    const connectorSettings = {
      ...params,
      walletConnectInitOptions: { ...params?.walletConnectInitOptions, projectId },
    };

    return new WalletConnectV2Connector({
      connectorSettings,
      coreOptions,
    });
  };
};
