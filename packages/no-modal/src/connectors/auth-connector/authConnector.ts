import { type EthereumProviderConfig } from "@toruslabs/ethereum-controllers";
import { Auth, LOGIN_PROVIDER, LoginParams, SUPPORTED_KEY_CURVES, UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/auth";
import { type default as WsEmbed } from "@web3auth/ws-embed";
import deepmerge from "deepmerge";

import {
  BaseConnector,
  CHAIN_NAMESPACES,
  cloneDeep,
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
  IProvider,
  log,
  UserInfo,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";

import type { AuthConnectorOptions, LoginConfig, LoginSettings, PrivateKeyProvider, WalletServicesSettings } from "./interface";

export type AuthLoginParams = LoginParams & {
  // to maintain backward compatibility
  login_hint?: string;
};

class AuthConnector extends BaseConnector<AuthLoginParams> {
  readonly name: string = WALLET_CONNECTORS.AUTH;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.MULTICHAIN;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.IN_APP;

  public authInstance: Auth | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public privateKeyProvider: PrivateKeyProvider | null = null;

  private authOptions: AuthConnectorOptions["connectorSettings"];

  private loginSettings: LoginSettings = { loginProvider: "" };

  private wsSettings: WalletServicesSettings = {};

  private wsEmbedInstance: WsEmbed | null = null;

  constructor(params: AuthConnectorOptions) {
    super(params);

    this.authOptions = params.connectorSettings;
    this.loginSettings = params.loginSettings || { loginProvider: "" };
    this.wsSettings = params.walletServicesSettings || {};
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY) {
      if (this.wsEmbedInstance?.provider) {
        return this.wsEmbedInstance.provider;
      } else if (this.privateKeyProvider) return this.privateKeyProvider;
    }
    return null;
  }

  get wsEmbed(): WsEmbed {
    return this.wsEmbedInstance;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === options.chainId);

    super.checkInitializationRequirements({ chainConfig });
    if (!this.coreOptions.clientId) throw WalletInitializationError.invalidParams("clientId is required before auth's initialization");
    if (!this.authOptions) throw WalletInitializationError.invalidParams("authOptions is required before auth's initialization");
    const isRedirectResult = this.authOptions.uxMode === UX_MODE.REDIRECT;

    this.authOptions = { ...this.authOptions, replaceUrlOnRedirect: isRedirectResult, useCoreKitKey: this.coreOptions.useCoreKitKey };
    const web3AuthNetwork = this.coreOptions.web3AuthNetwork || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    this.authInstance = new Auth({
      ...this.authOptions,
      clientId: this.coreOptions.clientId,
      network: web3AuthNetwork,
    });
    log.debug("initializing auth connector init");

    await this.authInstance.init();

    // Use this for xrpl, mpc cases
    if (this.coreOptions.privateKeyProvider) {
      this.privateKeyProvider = this.coreOptions.privateKeyProvider;
    } else {
      // initialize ws embed or private key provider based on chain namespace
      switch (chainConfig.chainNamespace) {
        case CHAIN_NAMESPACES.EIP155:
        case CHAIN_NAMESPACES.SOLANA: {
          const { default: WsEmbed } = await import("@web3auth/ws-embed");
          this.wsEmbedInstance = new WsEmbed({
            web3AuthClientId: this.coreOptions.clientId,
            web3AuthNetwork,
            modalZIndex: this.wsSettings.modalZIndex,
          });
          // TODO: once support multiple chains, only pass chains of solana and EVM
          await this.wsEmbedInstance.init({
            ...this.wsSettings,
            chainConfig: chainConfig as EthereumProviderConfig, // TODO: upgrade ws-embed to support custom chain config
            whiteLabel: {
              ...this.authOptions.whiteLabel,
              ...this.wsSettings.whiteLabel,
            },
          });
          break;
        }
        case CHAIN_NAMESPACES.XRPL:
          throw WalletLoginError.connectionError("Private key provider is required for XRPL");
        default: {
          const { CommonPrivateKeyProvider } = await import("@/core/base-provider");
          this.privateKeyProvider = new CommonPrivateKeyProvider({
            config: {
              chain: chainConfig,
              chains: this.coreOptions.chains,
            },
          });
        }
      }
    }

    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.AUTH);

    try {
      log.debug("initializing auth connector");
      const { sessionId } = this.authInstance || {};
      // connect only if it is redirect result or if connect (connector is cached/already connected in same session) is true
      if (sessionId && (options.autoConnect || isRedirectResult)) {
        this.rehydrated = true;
        await this.connect({ chainId: options.chainId });
      }
    } catch (error) {
      log.error("Failed to connect with cached auth provider", error);
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect(params: Partial<AuthLoginParams> & { chainId: string }): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { ...params, connector: WALLET_CONNECTORS.AUTH });
    try {
      await this.connectWithProvider(params);
      return this.provider;
    } catch (error: unknown) {
      log.error("Failed to connect with auth provider", error);
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      if ((error as Error)?.message.includes("user closed popup")) {
        throw WalletLoginError.popupClosed();
      } else if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to login with auth", error);
    }
  }

  public async enableMFA(params: AuthLoginParams = { loginProvider: "" }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    try {
      await this.authInstance.enableMFA(params);
    } catch (error: unknown) {
      log.error("Failed to enable MFA with auth provider", error);
      if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to enable MFA with auth", error);
    }
  }

  public async manageMFA(params: AuthLoginParams = { loginProvider: "" }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    try {
      await this.authInstance.manageMFA(params);
    } catch (error: unknown) {
      log.error("Failed to manage MFA with auth provider", error);
      if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to manage MFA with auth", error);
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    this.status = CONNECTOR_STATUS.DISCONNECTING;
    await this.authInstance.logout();
    if (this.wsEmbedInstance) await this.wsEmbedInstance.logout();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.authInstance = null;
      if (this.wsEmbedInstance) this.wsEmbedInstance = null;
      if (this.privateKeyProvider) this.privateKeyProvider = null;
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
    return { idToken: userInfo.idToken as string };
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    const userInfo = this.authInstance.getUserInfo();
    return userInfo;
  }

  // we don't support switching between different namespaces, except for solana and evm
  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    // get chains and namespaces
    const { chainId: newChainId } = params;
    const { chainId: currentChainId } = this.provider;
    const { chainNamespace: currentNamespace } = this.getChain(currentChainId);
    const { chainNamespace: newNamespace } = this.getChain(newChainId);

    // skip if chainId is the same
    if (currentChainId === newChainId) return;

    if (currentNamespace === CHAIN_NAMESPACES.SOLANA || currentNamespace === CHAIN_NAMESPACES.EIP155) {
      // can only switch to solana or evm
      if (newNamespace !== CHAIN_NAMESPACES.SOLANA && newNamespace !== CHAIN_NAMESPACES.EIP155)
        throw WalletLoginError.connectionError("Cannot switch to other chain namespace");

      const fullChainId = `${newNamespace}:${Number(params.chainId)}`;
      await this.wsEmbedInstance.provider?.request({
        method: "wallet_switchChain",
        params: { chainId: fullChainId },
      });
    } else {
      // cannot switch to other namespaces
      if (currentNamespace !== newNamespace) throw WalletLoginError.connectionError("Cannot switch to other chain namespace");
      await this.privateKeyProvider?.switchChain(params);
    }
  }

  private getChain(chainId: string) {
    return this.coreOptions.chains.find((x) => x.chainId === chainId);
  }

  private _getFinalPrivKey() {
    if (!this.authInstance) return "";
    let finalPrivKey = this.authInstance.privKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.coreOptions.useCoreKitKey) {
      // this is to check if the user has already logged in but coreKitKey is not available.
      // when useCoreKitKey is set to true.
      // This is to ensure that when there is no user session active, we don't throw an exception.
      if (this.authInstance.privKey && !this.authInstance.coreKitKey) {
        throw WalletLoginError.coreKitKeyNotFound();
      }
      finalPrivKey = this.authInstance.coreKitKey;
    }
    return finalPrivKey;
  }

  private async connectWithProvider(params: Partial<AuthLoginParams> & { chainId: string }): Promise<void> {
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === params.chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");
    const { chainNamespace } = chainConfig;

    // if not logged in then login
    const keyAvailable =
      chainNamespace === CHAIN_NAMESPACES.EIP155 || chainNamespace === CHAIN_NAMESPACES.SOLANA
        ? this.authInstance?.sessionId
        : this._getFinalPrivKey();
    if (!keyAvailable || params.extraLoginOptions?.id_token) {
      // always use "other" curve to return token with all keys encoded so wallet service can switch between evm and solana namespace
      this.loginSettings.curve = SUPPORTED_KEY_CURVES.OTHER;

      if (!params.loginProvider && !this.loginSettings.loginProvider)
        throw WalletInitializationError.invalidParams("loginProvider is required for login");
      await this.authInstance.login(
        deepmerge.all([
          this.loginSettings,
          params,
          { extraLoginOptions: { ...(params.extraLoginOptions || {}), login_hint: params.login_hint || params.extraLoginOptions?.login_hint } },
        ]) as AuthLoginParams
      );
    }

    // setup WS embed if chainNamespace is EIP155 or SOLANA
    if (chainNamespace === CHAIN_NAMESPACES.EIP155 || chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { sessionId, sessionNamespace } = this.authInstance || {};
      if (sessionId) {
        const isLoggedIn = await this.wsEmbedInstance.loginWithSessionId({
          sessionId,
          sessionNamespace,
        });
        if (isLoggedIn) {
          this.status = CONNECTOR_STATUS.CONNECTED;
          this.emit(CONNECTOR_EVENTS.CONNECTED, {
            connector: WALLET_CONNECTORS.AUTH,
            reconnected: this.rehydrated,
            provider: this.provider,
          } as CONNECTED_EVENT_DATA);
          // handle disconnect from ws embed
          this.wsEmbedInstance?.provider.on("accountsChanged", (accounts: unknown[] = []) => {
            if ((accounts as string[]).length === 0 && this.status === CONNECTOR_STATUS.CONNECTED) this.disconnect({ cleanup: false });
          });
        }
      }
    } else {
      // setup private key provider if chainNamespace is other
      const finalPrivKey = this._getFinalPrivKey();
      if (finalPrivKey) {
        await this.privateKeyProvider.setupProvider(finalPrivKey, params.chainId);
        this.status = CONNECTOR_STATUS.CONNECTED;
        this.emit(CONNECTOR_EVENTS.CONNECTED, {
          connector: WALLET_CONNECTORS.AUTH,
          reconnected: this.rehydrated,
          provider: this.provider,
        } as CONNECTED_EVENT_DATA);
      }
    }
  }
}

export const authConnector = (params?: Omit<AuthConnectorOptions, "coreOptions">): ConnectorFn => {
  return ({ projectConfig, coreOptions }: ConnectorParams) => {
    // Connector settings
    const connectorSettings: AuthConnectorOptions["connectorSettings"] = {};
    const { sms_otp_enabled: smsOtpEnabled, whitelist } = projectConfig;
    if (smsOtpEnabled !== undefined) {
      connectorSettings.loginConfig = {
        [LOGIN_PROVIDER.SMS_PASSWORDLESS]: {
          showOnModal: smsOtpEnabled,
          showOnDesktop: smsOtpEnabled,
          showOnMobile: smsOtpEnabled,
          showOnSocialBackupFactor: smsOtpEnabled,
        } as LoginConfig[keyof LoginConfig],
      };
    }
    if (whitelist) connectorSettings.originData = whitelist.signed_urls;
    if (coreOptions.uiConfig?.uxMode) connectorSettings.uxMode = coreOptions.uiConfig.uxMode;
    const uiConfig = deepmerge(cloneDeep(projectConfig?.whitelabel || {}), coreOptions.uiConfig || {});
    if (!uiConfig.mode) uiConfig.mode = "light";
    connectorSettings.whiteLabel = uiConfig;
    const finalConnectorSettings = deepmerge.all([
      { uxMode: UX_MODE.POPUP }, // default settings
      params?.connectorSettings || {},
      connectorSettings,
    ]) as AuthConnectorOptions["connectorSettings"];

    // WS settings
    const isKeyExportEnabled = typeof projectConfig.key_export_enabled === "boolean" ? projectConfig.key_export_enabled : true;
    const finalWsSettings: WalletServicesSettings = {
      ...coreOptions.walletServicesConfig,
      whiteLabel: {
        ...uiConfig,
        ...coreOptions.walletServicesConfig?.whiteLabel,
      },
      accountAbstractionConfig: coreOptions.accountAbstractionConfig,
      enableLogging: coreOptions.enableLogging,
      // enableKeyExport: keyExportEnabled, TODO: add this to ws embed and implement in WS
    };

    // Core options
    if (coreOptions.privateKeyProvider) coreOptions.privateKeyProvider.setKeyExportFlag(isKeyExportEnabled);

    return new AuthConnector({
      connectorSettings: finalConnectorSettings,
      walletServicesSettings: finalWsSettings,
      loginSettings: params?.loginSettings,
      coreOptions,
    });
  };
};

export type AuthConnectorType = AuthConnector;
