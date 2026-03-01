import { type ProviderConfig } from "@toruslabs/base-controllers";
import { SecurePubSub } from "@toruslabs/secure-pub-sub";
import {
  Auth,
  type AUTH_CONNECTION_TYPE,
  type Auth0ClientOptions,
  type Auth0UserInfo,
  AuthConnectionConfigItem,
  BUILD_ENV,
  createHandler,
  type CreateHandlerParams,
  getUserId,
  type LoginParams,
  PopupHandler,
  randomId,
  SDK_MODE,
  SUPPORTED_KEY_CURVES,
  UX_MODE,
  version,
} from "@web3auth/auth";
import { type default as WsEmbed, WS_EMBED_LOGIN_MODE } from "@web3auth/ws-embed";
import deepmerge from "deepmerge";

import {
  AuthLoginParams,
  BaseConnector,
  BaseConnectorLoginParams,
  CHAIN_NAMESPACES,
  cloneDeep,
  CONNECTED_EVENT_DATA,
  CONNECTED_STATUSES,
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
  IdentityTokenInfo,
  IProvider,
  log,
  UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "../../base";
import { parseToken } from "../utils";
import type { AuthConnectorOptions, LoginSettings, PrivateKeyProvider, WalletServicesSettings } from "./interface";

class AuthConnector extends BaseConnector<AuthLoginParams> {
  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.AUTH;

  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.MULTICHAIN;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.IN_APP;

  public authInstance: Auth | null = null;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  public privateKeyProvider: PrivateKeyProvider | null = null;

  private authOptions: AuthConnectorOptions["connectorSettings"];

  private loginSettings: LoginSettings = { authConnection: "" };

  private wsSettings: WalletServicesSettings;

  private wsEmbedInstance: WsEmbed | null = null;

  private authConnectionConfig: (AuthConnectionConfigItem & { isDefault?: boolean })[] = [];

  private wsEmbedInstancePromise: Promise<void> | null = null;

  constructor(params: AuthConnectorOptions) {
    super(params);

    this.authOptions = params.connectorSettings;
    this.loginSettings = params.loginSettings || { authConnection: "" };
    this.wsSettings = params.walletServicesSettings || { loginMode: WS_EMBED_LOGIN_MODE.PLUGIN };
    this.authConnectionConfig = params.authConnectionConfig || [];
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY) {
      if (this.wsEmbedInstance?.provider) {
        return this.wsEmbedInstance.provider as IProvider;
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
    const { chains } = this.coreOptions;
    const { chainId } = options;
    const chainConfig = chains.find((x) => x.chainId === chainId);

    super.checkInitializationRequirements({ chainConfig });
    if (!this.coreOptions.clientId) throw WalletInitializationError.invalidParams("clientId is required before auth's initialization");
    if (!this.authOptions) throw WalletInitializationError.invalidParams("authOptions is required before auth's initialization");
    if (this.authConnectionConfig.length === 0)
      throw WalletInitializationError.invalidParams("authConnectionConfig is required before auth's initialization");
    const isRedirectResult = this.authOptions.uxMode === UX_MODE.REDIRECT;

    this.authOptions = { ...this.authOptions, replaceUrlOnRedirect: isRedirectResult, useCoreKitKey: this.coreOptions.useSFAKey };
    this.authInstance = new Auth({
      ...this.authOptions,
      clientId: this.coreOptions.clientId,
      network: this.coreOptions.web3AuthNetwork,
      sdkMode: SDK_MODE.IFRAME,
      authConnectionConfig: this.authConnectionConfig.filter((x) => !x.isDefault),
      mfaSettings: this.coreOptions.mfaSettings,
    });
    log.debug("initializing auth connector init", this.authOptions);

    // making it async here to initialize provider.
    const authInstancePromise = this.authInstance.init();

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
            web3AuthNetwork: this.coreOptions.web3AuthNetwork,
            modalZIndex: this.wsSettings.modalZIndex,
          });
          const wsSupportedChains = chains.filter(
            (x) => x.chainNamespace === CHAIN_NAMESPACES.EIP155 || x.chainNamespace === CHAIN_NAMESPACES.SOLANA
          );
          this.wsEmbedInstancePromise = this.wsEmbedInstance
            .init({
              ...this.wsSettings,
              loginMode: WS_EMBED_LOGIN_MODE.PLUGIN,
              chains: wsSupportedChains as ProviderConfig[],
              chainId,
              whiteLabel: {
                ...this.authOptions.whiteLabel,
                ...this.wsSettings.whiteLabel,
              },
            })
            .then(() => {
              this.wsEmbedInstancePromise = null;
              return;
            });
          break;
        }
        case CHAIN_NAMESPACES.XRPL:
          throw WalletLoginError.connectionError("Private key provider is required for XRPL");
        default: {
          const { CommonPrivateKeyProvider } = await import("../../providers/base-provider");
          this.privateKeyProvider = new CommonPrivateKeyProvider({
            config: {
              chain: chainConfig,
              chains: this.coreOptions.chains,
            },
          });
        }
      }
    }

    // wait for auth instance to be ready.
    log.debug("initializing auth connector");
    await authInstancePromise;

    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.AUTH);

    try {
      const { sessionId } = this.authInstance || {};
      // connect only if it is redirect result or if connect (connector is cached/already connected in same session) is true
      if (sessionId && (options.autoConnect || isRedirectResult)) {
        this.rehydrated = true;
        await this.connect({ chainId: options.chainId, getIdentityToken: options.getIdentityToken });
      } else if (!sessionId && options.autoConnect) {
        // if here, this means that the connector is cached but the sessionId is not available.
        // this can happen if the sessionId has expired.
        // we are throwing an error to reset the cached state.
        throw WalletLoginError.connectionError("Failed to rehydrate");
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, error as Web3AuthError);
    }
  }

  async connect(params: Partial<AuthLoginParams> & BaseConnectorLoginParams): Promise<IProvider | null> {
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
      if ((error as Error)?.message?.includes("user closed popup")) {
        throw WalletLoginError.popupClosed();
      } else if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to login with auth", error);
    }
  }

  public async enableMFA(params: AuthLoginParams = { authConnection: "" }): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    try {
      const result = await this.authInstance.enableMFA(params);
      // In redirect mode, the result is not available immediately, so we emit the event when the result is available.
      if (result) this.emit(CONNECTOR_EVENTS.MFA_ENABLED, result);
    } catch (error: unknown) {
      log.error("Failed to enable MFA with auth provider", error);
      if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to enable MFA with auth", error);
    }
  }

  public async manageMFA(params: AuthLoginParams = { authConnection: "" }): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
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
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
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

  async getIdentityToken(): Promise<{ idToken: string }> {
    if (!this.canAuthorize) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: WALLET_CONNECTORS.AUTH });
    const userInfo = await this.getUserInfo();
    this.status = CONNECTOR_STATUS.AUTHORIZED;
    this.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: WALLET_CONNECTORS.AUTH, identityTokenInfo: { idToken: userInfo.idToken as string } });
    return { idToken: userInfo.idToken as string };
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.canAuthorize) throw WalletLoginError.notConnectedError("Not connected with wallet");
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

  public async cleanup(): Promise<void> {
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    await this.authInstance.cleanup();

    if (this.wsEmbedInstance) {
      this.wsEmbedInstance.clearInit();
    }
  }

  public getOAuthProviderConfig(params: Pick<AuthLoginParams, "authConnection" | "authConnectionId" | "groupedAuthConnectionId">) {
    const { authConnection, authConnectionId, groupedAuthConnectionId } = params;
    const providerConfig = this.authConnectionConfig.find((x) => {
      if (groupedAuthConnectionId && authConnectionId) {
        return (
          x.authConnection === authConnection && x.groupedAuthConnectionId === groupedAuthConnectionId && x.authConnectionId === authConnectionId
        );
      }
      if (authConnectionId) {
        return x.authConnection === authConnection && x.authConnectionId === authConnectionId;
      }
      // return the default auth connection, if not found, return undefined
      return x.authConnection === authConnection && x.isDefault;
    });
    return providerConfig;
  }

  private getChain(chainId: string) {
    return this.coreOptions.chains.find((x) => x.chainId === chainId);
  }

  private _getFinalPrivKey() {
    if (!this.authInstance) return "";
    let finalPrivKey = this.authInstance.privKey;
    // coreKitKey is available only for custom connections by default
    if (this.coreOptions.useSFAKey) {
      // this is to check if the user has already logged in but coreKitKey is not available.
      // when useSFAKey is set to true.
      // This is to ensure that when there is no user session active, we don't throw an exception.
      if (this.authInstance.privKey && !this.authInstance.coreKitKey) {
        throw WalletLoginError.sfaKeyNotFound();
      }
      finalPrivKey = this.authInstance.coreKitKey;
    }
    return finalPrivKey;
  }

  private async connectWithProvider(params: Partial<AuthLoginParams> & BaseConnectorLoginParams): Promise<void> {
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === params.chainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");
    const { chainNamespace } = chainConfig;

    // if not logged in then login
    const keyAvailable =
      chainNamespace === CHAIN_NAMESPACES.EIP155 || chainNamespace === CHAIN_NAMESPACES.SOLANA
        ? this.authInstance?.sessionId
        : this._getFinalPrivKey();

    if (params.idToken) params.extraLoginOptions = { ...params.extraLoginOptions, id_token: params.idToken };

    if (!keyAvailable || params.extraLoginOptions?.id_token) {
      // always use "other" curve to return token with all keys encoded so wallet service can switch between evm and solana namespace
      this.loginSettings.curve = SUPPORTED_KEY_CURVES.OTHER;

      const loginParams = deepmerge(this.loginSettings, params) as Partial<AuthLoginParams> & BaseConnectorLoginParams;

      if (params.extraLoginOptions?.id_token) {
        await this.connectWithJwtLogin(loginParams);
      } else {
        await this.connectWithSocialLogin(loginParams);
      }
    }

    // if useSFAKey is true and privKey is available but coreKitKey is not available, throw an error
    if (this.coreOptions.useSFAKey && this.authInstance?.privKey && !this.authInstance?.coreKitKey) {
      // If the user is already logged in, logout and throw an error
      if (this.authInstance.sessionId) {
        await this.authInstance.logout();
      }
      throw WalletLoginError.sfaKeyNotFound(
        "This typically occurs when the authentication method used does not provide SFA keys (e.g., default auth connection)."
      );
    }

    // setup WS embed if chainNamespace is EIP155 or SOLANA
    if (chainNamespace === CHAIN_NAMESPACES.EIP155 || chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      // wait for ws embed instance to be ready.
      if (this.wsEmbedInstancePromise) await this.wsEmbedInstancePromise;

      const { sessionId, sessionNamespace } = this.authInstance || {};
      if (sessionId) {
        const isLoggedIn = await this.wsEmbedInstance.loginWithSessionId({
          sessionId,
          sessionNamespace,
        });
        if (isLoggedIn) {
          // if getIdentityToken is true, then get the identity token
          // No need to get the identity token for auth connector as it is already handled
          let identityTokenInfo: IdentityTokenInfo | undefined;
          this.status = CONNECTOR_STATUS.CONNECTED;
          this.emit(CONNECTOR_EVENTS.CONNECTED, {
            connector: WALLET_CONNECTORS.AUTH,
            reconnected: this.rehydrated,
            provider: this.provider,
            identityTokenInfo,
          } as CONNECTED_EVENT_DATA);

          if (params.getIdentityToken) {
            identityTokenInfo = await this.getIdentityToken();
          }
          // handle disconnect from ws embed
          this.wsEmbedInstance?.provider.on("accountsChanged", (accounts: unknown[] = []) => {
            if ((accounts as string[]).length === 0 && CONNECTED_STATUSES.includes(this.status)) this.disconnect({ cleanup: false });
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

  private async connectWithSocialLogin(params: Partial<AuthLoginParams> & { chainId: string }) {
    const providerConfig = this.getOAuthProviderConfig({
      authConnection: params.authConnection,
      authConnectionId: params.authConnectionId,
      groupedAuthConnectionId: params.groupedAuthConnectionId,
    });

    if (!providerConfig?.authConnection) throw WalletLoginError.connectionError("Invalid auth connection.");

    const jwtParams = {
      ...(providerConfig.jwtParameters || {}),
      ...(params.extraLoginOptions || {}),
      login_hint: params.loginHint || params.extraLoginOptions?.login_hint,
    } as Auth0ClientOptions;

    const nonce = randomId();

    // post a message to the auth provider to indicate that login has been initiated.
    const loginParams = cloneDeep(params);
    loginParams.extraLoginOptions = {
      ...(loginParams.extraLoginOptions || {}),
      login_hint: params.loginHint || params.extraLoginOptions?.login_hint,
    };
    delete loginParams.chainId;

    const popupParams: CreateHandlerParams = {
      authConnection: params.authConnection as AUTH_CONNECTION_TYPE,
      authConnectionId: providerConfig.authConnectionId,
      clientId: providerConfig.clientId || jwtParams.client_id,
      groupedAuthConnectionId: providerConfig.groupedAuthConnectionId,
      redirect_uri: `${this.authInstance.options.sdkUrl}/auth`,
      jwtParams,
      customState: {
        nonce,
        appState: params.appState,
        // use the default settings from the auth instance.
        dapp_redirect_url: this.authInstance.options.redirectUrl,
        uxMode: this.authInstance.options.uxMode,
        whiteLabel: JSON.stringify(this.authInstance.options.whiteLabel),
        loginParams: JSON.stringify(loginParams),
        version: version.split(".")[0],
        web3AuthNetwork: this.coreOptions.web3AuthNetwork,
        web3AuthClientId: this.coreOptions.clientId,
        originData: this.authInstance.options.originData ? JSON.stringify(this.authInstance.options.originData) : undefined,
      },
      web3AuthClientId: this.coreOptions.clientId,
      web3AuthNetwork: this.coreOptions.web3AuthNetwork,
    };

    const loginHandler = createHandler(popupParams);
    const verifierWindow = new PopupHandler({
      url: loginHandler.finalURL,
      timeout: 0,
    });

    if (this.authOptions.uxMode === UX_MODE.REDIRECT) return verifierWindow.redirect(this.authOptions.replaceUrlOnRedirect);

    let isClosedWindow = false;

    return new Promise((resolve, reject) => {
      verifierWindow.open().catch((error: unknown) => {
        log.error("Error during login with social", error);
        this.authInstance.postLoginCancelledMessage(nonce);
        reject(error);
      });

      // this is to close the popup when the login is finished.
      const securePubSub = new SecurePubSub({ sameIpCheck: true });
      securePubSub
        .subscribe(`web3auth-login-${nonce}`)
        .then((data: string) => {
          const parsedData = JSON.parse(data || "{}");
          if (parsedData?.message === "login_finished") {
            if (parsedData?.error) {
              this.authInstance.postLoginCancelledMessage(nonce);
              reject(parsedData.error);
            }
            isClosedWindow = true;
            securePubSub.cleanup();
            verifierWindow.close();
          }
          return true;
        })
        .catch((error: unknown) => {
          // swallow the error, dont need to throw.
          log.error("Error during login with social", error);
        });

      verifierWindow.once("close", () => {
        if (!isClosedWindow) {
          securePubSub.cleanup();
          this.authInstance.postLoginCancelledMessage(nonce);
          reject(WalletLoginError.popupClosed());
        }
      });

      this.authInstance
        .postLoginInitiatedMessage(loginParams as LoginParams, nonce)
        .then(resolve)
        .catch((error: unknown) => {
          if (error instanceof Web3AuthError) {
            throw error;
          }
          reject(WalletLoginError.connectionError(error instanceof Error ? error.message : (error as string) || "Failed to login with social"));
        });
    });
  }

  private connectWithJwtLogin(params: Partial<AuthLoginParams> & { chainId: string }) {
    const loginConfig = this.getOAuthProviderConfig({
      authConnection: params.authConnection,
      authConnectionId: params.authConnectionId,
      groupedAuthConnectionId: params.groupedAuthConnectionId,
    });

    // throw error only when we cannot find the login config and authConnectionId is not provided in the params.
    // otherwise, we will use the params to create a new auth connection config in the auth instance.
    if (!loginConfig?.authConnection && !params.authConnectionId) throw WalletLoginError.connectionError("Invalid auth connection.");

    if (!loginConfig?.authConnection) {
      this.authInstance.options.authConnectionConfig.push({
        authConnection: params.authConnection as AUTH_CONNECTION_TYPE,
        authConnectionId: params.authConnectionId,
        groupedAuthConnectionId: params.groupedAuthConnectionId,
      });
    }

    const loginParams = cloneDeep(params);

    const finalExtraLoginOptions = {
      ...(loginConfig?.jwtParameters || {}),
      ...(params.extraLoginOptions || {}),
    } as Auth0ClientOptions;

    let finalUserId;
    if (params.loginHint || params.extraLoginOptions?.login_hint) {
      finalUserId = params.loginHint || params.extraLoginOptions?.login_hint;
    } else if (params.extraLoginOptions?.id_token) {
      const { payload } = parseToken<Auth0UserInfo>(params.extraLoginOptions.id_token);
      finalUserId = getUserId(
        payload,
        loginParams.authConnection as AUTH_CONNECTION_TYPE,
        finalExtraLoginOptions.userIdField,
        finalExtraLoginOptions.isUserIdCaseSensitive
      );
    } else {
      throw WalletLoginError.connectionError("Invalid login hint or id_token");
    }

    // Adds the login_hint to the extraLoginOptions.
    loginParams.extraLoginOptions = {
      ...finalExtraLoginOptions,
      login_hint: finalUserId,
    };

    delete loginParams.chainId;

    return this.authInstance.postLoginInitiatedMessage(loginParams as LoginParams);
  }
}

type AuthConnectorFuncParams = Omit<AuthConnectorOptions, "coreOptions" | "authConnectionConfig" | "connectorSettings"> & {
  connectorSettings?: Omit<AuthConnectorOptions["connectorSettings"], "buildEnv">;
};

export const authConnector = (params?: AuthConnectorFuncParams): ConnectorFn => {
  return ({ projectConfig, coreOptions }: ConnectorParams) => {
    // Connector settings
    const connectorSettings: AuthConnectorOptions["connectorSettings"] = {};
    const { whitelist, sessionTime } = projectConfig;
    if (whitelist) connectorSettings.originData = whitelist.signed_urls;

    // If sessionTime is provided in the coreOptions, it takes precedence over the sessionTime in the projectConfig.
    if (coreOptions.sessionTime) {
      connectorSettings.sessionTime = coreOptions.sessionTime;
    } else if (sessionTime) {
      connectorSettings.sessionTime = sessionTime;
    }

    if (coreOptions.uiConfig?.uxMode) connectorSettings.uxMode = coreOptions.uiConfig.uxMode;

    const uiConfig = coreOptions.uiConfig || {};
    connectorSettings.whiteLabel = uiConfig;
    const finalConnectorSettings = deepmerge.all([
      { uxMode: UX_MODE.POPUP, buildEnv: coreOptions.authBuildEnv || BUILD_ENV.PRODUCTION }, // default settings
      connectorSettings,
      params?.connectorSettings || {},
    ]) as AuthConnectorOptions["connectorSettings"];

    // WS settings
    const whiteLabel = deepmerge.all([uiConfig, coreOptions.walletServicesConfig?.whiteLabel || {}]);
    const finalWsSettings: WalletServicesSettings = {
      ...coreOptions.walletServicesConfig,
      whiteLabel,
      accountAbstractionConfig: coreOptions.accountAbstractionConfig,
      enableLogging: coreOptions.enableLogging,
    };

    // Core options
    const isKeyExportEnabled = coreOptions.walletServicesConfig?.enableKeyExport ?? true;
    if (coreOptions.privateKeyProvider) coreOptions.privateKeyProvider.setKeyExportFlag(isKeyExportEnabled);
    return new AuthConnector({
      connectorSettings: finalConnectorSettings,
      walletServicesSettings: finalWsSettings,
      loginSettings: { ...(params?.loginSettings || {}), mfaLevel: coreOptions.mfaLevel },
      coreOptions,
      authConnectionConfig: projectConfig.embeddedWalletAuth,
    });
  };
};

export type AuthConnectorType = AuthConnector;
