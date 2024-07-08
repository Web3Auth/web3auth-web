import OpenLogin from "@toruslabs/openlogin";
import { LoginParams, OPENLOGIN_NETWORK, OpenLoginOptions, SUPPORTED_KEY_CURVES, UX_MODE } from "@toruslabs/openlogin-utils";
import {
  BaseConnector,
  BaseConnectorSettings,
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
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import deepmerge from "deepmerge";

import { getSocialConnectorDefaultOptions } from "./config";
import type { LoginSettings, PrivateKeyProvider, SocialConnectorOptions } from "./interface";

export type OpenloginLoginParams = LoginParams & {
  // to maintain backward compatibility
  login_hint?: string;
};

export class SocialConnector extends BaseConnector<OpenloginLoginParams> {
  readonly name: string = WALLET_CONNECTORS.SOCIAL;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.MULTICHAIN;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.IN_APP;

  public socialConnectorInstance: OpenLogin | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  public privateKeyProvider: PrivateKeyProvider | null = null;

  private socialConnectorOptions: SocialConnectorOptions["connectorSettings"];

  private loginSettings: LoginSettings = { loginProvider: "" };

  constructor(params: SocialConnectorOptions = {}) {
    super(params);
    this.setConnectorSettings({
      ...params.connectorSettings,
      chainConfig: params.chainConfig,
      clientId: params.clientId || "",
      sessionTime: params.sessionTime,
      web3AuthNetwork: params.web3AuthNetwork,
      useCoreKitKey: params.useCoreKitKey,
      privateKeyProvider: params.privateKeyProvider,
    });
    this.loginSettings = params.loginSettings || { loginProvider: "" };
    this.privateKeyProvider = params.privateKeyProvider || null;
  }

  get chainConfigProxy(): CustomChainConfig | null {
    return this.chainConfig ? { ...this.chainConfig } : null;
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.privateKeyProvider) {
      return this.privateKeyProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.clientId) throw WalletInitializationError.invalidParams("clientId is required before openlogin's initialization");
    if (!this.socialConnectorOptions)
      throw WalletInitializationError.invalidParams("socialConnectorOptions is required before openlogin's initialization");
    const isRedirectResult = this.socialConnectorOptions.uxMode === UX_MODE.REDIRECT;

    this.socialConnectorOptions = {
      ...this.socialConnectorOptions,
      replaceUrlOnRedirect: isRedirectResult,
      useCoreKitKey: this.useCoreKitKey,
    };
    this.socialConnectorInstance = new OpenLogin({
      ...this.socialConnectorOptions,
      clientId: this.clientId,
      network: this.socialConnectorOptions.network || this.web3AuthNetwork || OPENLOGIN_NETWORK.SAPPHIRE_MAINNET,
    });
    log.debug("initializing openlogin connector init");

    await this.socialConnectorInstance.init();

    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");

    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.SOCIAL);

    try {
      log.debug("initializing openlogin connector");

      const finalPrivKey = this._getFinalPrivKey();
      // connect only if it is redirect result or if connect (connector is cached/already connected in same session) is true
      if (finalPrivKey && (options.autoConnect || isRedirectResult)) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached openlogin provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params: OpenloginLoginParams = { loginProvider: "" }): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { ...params, connector: WALLET_CONNECTORS.SOCIAL });
    try {
      await this.connectWithProvider(params);
      return this.provider;
    } catch (error: unknown) {
      log.error("Failed to connect with openlogin provider", error);
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
      if ((error as Error)?.message.includes("user closed popup")) {
        throw WalletLoginError.popupClosed();
      } else if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to login with openlogin");
    }
  }

  public async enableMFA(params: OpenloginLoginParams = { loginProvider: "" }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.socialConnectorInstance) throw WalletInitializationError.notReady("socialConnectorInstance is not ready");
    try {
      await this.socialConnectorInstance.enableMFA(params);
    } catch (error: unknown) {
      log.error("Failed to enable MFA with openlogin provider", error);
      if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError((error as Error).message || "Failed to enable MFA with openlogin");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.socialConnectorInstance) throw WalletInitializationError.notReady("socialConnectorInstance is not ready");
    await this.socialConnectorInstance.logout();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.socialConnectorInstance = null;
      this.privateKeyProvider = null;
    } else {
      // ready to be connected again
      this.status = CONNECTOR_STATUS.READY;
    }

    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }

  async authenticateUser(): Promise<{ idToken: string }> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.getUserInfo();
    return {
      idToken: userInfo.idToken as string,
    };
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.socialConnectorInstance) throw WalletInitializationError.notReady("socialConnectorInstance is not ready");
    const userInfo = this.socialConnectorInstance.getUserInfo();
    return userInfo;
  }

  // should be called only before initialization.
  setConnectorSettings(connectorSettings: Partial<OpenLoginOptions & BaseConnectorSettings> & { privateKeyProvider?: PrivateKeyProvider }): void {
    super.setConnectorSettings(connectorSettings);
    const defaultOptions = getSocialConnectorDefaultOptions();
    log.info("setting connector settings", connectorSettings);
    this.socialConnectorOptions = deepmerge(
      deepmerge(defaultOptions.connectorSettings, this.socialConnectorOptions),
      connectorSettings
    ) as SocialConnectorOptions["connectorSettings"];
    if (connectorSettings.web3AuthNetwork) {
      this.socialConnectorOptions.network = connectorSettings.web3AuthNetwork;
    }
    if (connectorSettings.privateKeyProvider) {
      this.privateKeyProvider = connectorSettings.privateKeyProvider;
    }
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    this.privateKeyProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.privateKeyProvider?.switchChain(params);
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  private _getFinalPrivKey() {
    if (!this.socialConnectorInstance) return "";
    let finalPrivKey = this.socialConnectorInstance.privKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.useCoreKitKey) {
      // this is to check if the user has already logged in but coreKitKey is not available.
      // when useCoreKitKey is set to true.
      // This is to ensure that when there is no user session active, we don't throw an exception.
      if (this.socialConnectorInstance.privKey && !this.socialConnectorInstance.coreKitKey) {
        throw WalletLoginError.coreKitKeyNotFound();
      }
      finalPrivKey = this.socialConnectorInstance.coreKitKey;
    }
    return finalPrivKey;
  }

  private _getFinalEd25519PrivKey() {
    if (!this.socialConnectorInstance) return "";
    let finalPrivKey = this.socialConnectorInstance.ed25519PrivKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.useCoreKitKey) {
      // this is to check if the user has already logged in but coreKitKey is not available.
      // when useCoreKitKey is set to true.
      // This is to ensure that when there is no user session active, we don't throw an exception.
      if (this.socialConnectorInstance.ed25519PrivKey && !this.socialConnectorInstance.coreKitEd25519Key) {
        throw WalletLoginError.coreKitKeyNotFound();
      }
      finalPrivKey = this.socialConnectorInstance.coreKitEd25519Key;
    }
    return finalPrivKey;
  }

  private async connectWithProvider(params: OpenloginLoginParams = { loginProvider: "" }): Promise<void> {
    if (!this.privateKeyProvider) throw WalletInitializationError.invalidParams("PrivateKey Provider is required before initialization");
    if (!this.socialConnectorInstance) throw WalletInitializationError.notReady("socialConnectorInstance is not ready");

    const keyAvailable = this._getFinalPrivKey();
    // if not logged in then login
    if (!keyAvailable || params.extraLoginOptions?.id_token) {
      if (!this.loginSettings.curve) {
        this.loginSettings.curve =
          this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA ? SUPPORTED_KEY_CURVES.ED25519 : SUPPORTED_KEY_CURVES.SECP256K1;
      }
      if (!params.loginProvider && !this.loginSettings.loginProvider)
        throw WalletInitializationError.invalidParams("loginProvider is required for login");
      await this.socialConnectorInstance.login(
        deepmerge(deepmerge(this.loginSettings, params), {
          extraLoginOptions: { ...(params.extraLoginOptions || {}), login_hint: params.login_hint || params.extraLoginOptions?.login_hint },
        })
      );
    }
    let finalPrivKey = this._getFinalPrivKey();
    if (finalPrivKey) {
      if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
        finalPrivKey = this._getFinalEd25519PrivKey();
      }

      await this.privateKeyProvider.setupProvider(finalPrivKey);
      this.status = CONNECTOR_STATUS.CONNECTED;
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.SOCIAL,
        reconnected: this.rehydrated,
        provider: this.provider,
      } as CONNECTED_EVENT_DATA);
    }
  }
}
