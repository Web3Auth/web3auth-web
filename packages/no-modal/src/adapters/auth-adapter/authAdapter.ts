import { type EthereumProviderConfig } from "@toruslabs/ethereum-controllers";
import { Auth, LOGIN_PROVIDER, LoginParams, SUPPORTED_KEY_CURVES, UX_MODE, UX_MODE_TYPE, WEB3AUTH_NETWORK } from "@web3auth/auth";
import { type default as WsEmbed } from "@web3auth/ws-embed";
import deepmerge from "deepmerge";

import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterFn,
  AdapterInitOptions,
  AdapterNamespaceType,
  AdapterParams,
  BaseAdapter,
  CHAIN_NAMESPACES,
  cloneDeep,
  CONNECTED_EVENT_DATA,
  IProvider,
  log,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  WalletServicesSettings,
  Web3AuthError,
} from "@/core/base";

import { getAuthDefaultOptions } from "./config";
import type { AuthAdapterOptions, LoginConfig, LoginSettings, PrivateKeyProvider } from "./interface";

export type AuthLoginParams = LoginParams & {
  // to maintain backward compatibility
  login_hint?: string;
};

class AuthAdapter extends BaseAdapter<AuthLoginParams> {
  readonly name: string = WALLET_ADAPTERS.AUTH;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public authInstance: Auth | null = null;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public privateKeyProvider: PrivateKeyProvider | null = null;

  private authOptions: AuthAdapterOptions["adapterSettings"];

  private loginSettings: LoginSettings = { loginProvider: "" };

  private wsSettings: WalletServicesSettings = {};

  private wsEmbedInstance: WsEmbed | null = null;

  constructor(params: AuthAdapterOptions = {}) {
    super(params);

    // set auth options
    const defaultOptions = getAuthDefaultOptions();
    log.info("setting adapter settings", params.adapterSettings);
    this.authOptions = deepmerge.all([
      defaultOptions.adapterSettings,
      this.authOptions || {},
      params.adapterSettings || {},
    ]) as AuthAdapterOptions["adapterSettings"];

    this.loginSettings = params.loginSettings || { loginProvider: "" };
    this.wsSettings = params.walletServicesSettings || {};
  }

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY) {
      if (this.wsEmbedInstance?.provider) {
        return this.wsEmbedInstance.provider;
      }
    } else if (this.privateKeyProvider) return this.privateKeyProvider;
    return null;
  }

  get wsEmbed(): WsEmbed {
    return this.wsEmbedInstance;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions): Promise<void> {
    const coreOptions = this.getCoreOptions?.();
    const chainConfig = coreOptions.chainConfigs.find((x) => x.chainId === options.chainId);

    super.checkInitializationRequirements({ chainConfig });
    if (!coreOptions?.clientId) throw WalletInitializationError.invalidParams("clientId is required before auth's initialization");
    if (!this.authOptions) throw WalletInitializationError.invalidParams("authOptions is required before auth's initialization");
    const isRedirectResult = this.authOptions.uxMode === UX_MODE.REDIRECT;

    this.authOptions = { ...this.authOptions, replaceUrlOnRedirect: isRedirectResult, useCoreKitKey: coreOptions?.useCoreKitKey };
    const web3AuthNetwork = this.authOptions.network || coreOptions?.web3AuthNetwork || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    this.authInstance = new Auth({
      ...this.authOptions,
      clientId: coreOptions?.clientId,
      network: web3AuthNetwork,
    });
    log.debug("initializing auth adapter init");

    await this.authInstance.init();

    // initialize ws embed or private key provider based on chain namespace
    switch (chainConfig.chainNamespace) {
      case CHAIN_NAMESPACES.EIP155:
      case CHAIN_NAMESPACES.SOLANA: {
        const { default: WsEmbed } = await import("@web3auth/ws-embed");
        this.wsEmbedInstance = new WsEmbed({
          web3AuthClientId: coreOptions.clientId || "",
          web3AuthNetwork,
          modalZIndex: this.wsSettings.modalZIndex,
        });
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
      case CHAIN_NAMESPACES.XRPL: {
        const { XrplPrivateKeyProvider } = await import("@/core/xrpl-provider");
        this.privateKeyProvider = new XrplPrivateKeyProvider({
          config: { chainConfig },
        });
        break;
      }
      default: {
        const { CommonPrivateKeyProvider } = await import("@/core/base-provider");
        this.privateKeyProvider = new CommonPrivateKeyProvider({
          config: { chainConfig },
        });
      }
    }
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.AUTH);

    try {
      log.debug("initializing auth adapter");
      const { sessionId } = this.authInstance || {};
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (sessionId && (options.autoConnect || isRedirectResult)) {
        this.rehydrated = true;
        await this.connect({ chainId: options.chainId });
      }
    } catch (error) {
      log.error("Failed to connect with cached auth provider", error);
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect(params: Partial<AuthLoginParams> & { chainId: string }): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.AUTH });
    try {
      await this.connectWithProvider(params);
      return this.provider;
    } catch (error: unknown) {
      log.error("Failed to connect with auth provider", error);
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
      if ((error as Error)?.message.includes("user closed popup")) {
        throw WalletLoginError.popupClosed();
      } else if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to login with auth", error);
    }
  }

  public async enableMFA(params: AuthLoginParams = { loginProvider: "" }): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
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
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
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
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    await this.authInstance.logout();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.authInstance = null;
      if (this.privateKeyProvider) this.privateKeyProvider = null;
      if (this.wsEmbedInstance) this.wsEmbedInstance.logout();
    } else {
      // ready to be connected again
      this.status = ADAPTER_STATUS.READY;
    }

    this.rehydrated = false;
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
  }

  async authenticateUser(): Promise<{ idToken: string }> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.getUserInfo();
    return { idToken: userInfo.idToken as string };
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    const userInfo = this.authInstance.getUserInfo();
    return userInfo;
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    const currentChainId = this.provider.chainId;
    // TODO: handle when chainIds are the same
    // TODO: need to handle switching to a different chain namespace

    const chainConfig = this.getCoreOptions?.().chainConfigs.find((x) => x.chainId === currentChainId);
    if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");
    const { chainNamespace } = chainConfig;

    if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
      await this.wsEmbedInstance.provider?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: params.chainId }],
      });
    } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const fullChainId = `${CHAIN_NAMESPACES.SOLANA}:${Number(params.chainId)}`;
      await this.wsEmbedInstance.provider?.request({
        method: "wallet_switchChain",
        params: { chainId: fullChainId },
      });
    } else {
      await this.privateKeyProvider?.switchChain(params);
    }
  }

  private _getFinalPrivKey() {
    if (!this.authInstance) return "";
    let finalPrivKey = this.authInstance.privKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.getCoreOptions?.().useCoreKitKey) {
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
    const chainConfig = this.getCoreOptions?.().chainConfigs.find((x) => x.chainId === params.chainId);
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
          this.status = ADAPTER_STATUS.CONNECTED;
          this.emit(ADAPTER_EVENTS.CONNECTED, {
            adapter: WALLET_ADAPTERS.AUTH,
            reconnected: this.rehydrated,
            provider: this.provider,
          } as CONNECTED_EVENT_DATA);
          this.wsEmbedInstance?.provider.on("accountsChanged", (accounts: unknown[] = []) => {
            if ((accounts as string[]).length === 0 && this.status === ADAPTER_STATUS.CONNECTED) this.disconnect({ cleanup: false });
          });
        }
      }
    } else {
      // setup private key provider if chainNamespace is other
      const finalPrivKey = this._getFinalPrivKey();
      if (finalPrivKey) {
        await this.privateKeyProvider.setupProvider(finalPrivKey);
        this.status = ADAPTER_STATUS.CONNECTED;
        this.emit(ADAPTER_EVENTS.CONNECTED, {
          adapter: WALLET_ADAPTERS.AUTH,
          reconnected: this.rehydrated,
          provider: this.provider,
        } as CONNECTED_EVENT_DATA);
      }
    }
  }
}

export const authAdapter = (params?: { uxMode?: UX_MODE_TYPE }): AdapterFn => {
  return ({ projectConfig, coreOptions }: AdapterParams) => {
    const adapterSettings: AuthAdapterOptions["adapterSettings"] = {
      network: coreOptions.web3AuthNetwork || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
      clientId: coreOptions.clientId,
      uxMode: params?.uxMode || UX_MODE.POPUP,
    };

    // sms otp config
    const { sms_otp_enabled: smsOtpEnabled, whitelist } = projectConfig;
    if (smsOtpEnabled !== undefined) {
      adapterSettings.loginConfig = {
        [LOGIN_PROVIDER.SMS_PASSWORDLESS]: {
          showOnModal: smsOtpEnabled,
          showOnDesktop: smsOtpEnabled,
          showOnMobile: smsOtpEnabled,
          showOnSocialBackupFactor: smsOtpEnabled,
        } as LoginConfig[keyof LoginConfig],
      };
    }

    // whitelist config
    if (whitelist) {
      adapterSettings.originData = whitelist.signed_urls;
    }

    // whitelabel config
    const { whitelabel } = projectConfig;
    const uiConfig = deepmerge(cloneDeep(whitelabel || {}), coreOptions.uiConfig || {});
    if (!uiConfig.mode) uiConfig.mode = "light";
    adapterSettings.whiteLabel = uiConfig;

    // wallet services settings
    const finalWsSettings = {
      ...coreOptions.walletServicesSettings,
      enableLogging: coreOptions.enableLogging,
    };

    const adapterOptions: AuthAdapterOptions = {
      adapterSettings,
      walletServicesSettings: finalWsSettings,
      getCoreOptions: () => coreOptions,
    };
    return new AuthAdapter(adapterOptions);
  };
};

export type AuthAdapterType = AuthAdapter;
