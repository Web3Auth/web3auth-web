import { type EthereumProviderConfig } from "@toruslabs/ethereum-controllers";
import { Auth, AuthOptions, LoginParams, SUPPORTED_KEY_CURVES, UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/auth";
import { type default as WsEmbed, WsEmbedParams } from "@web3auth/ws-embed";
import deepmerge from "deepmerge";

import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapter,
  BaseAdapterSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";

import { getAuthDefaultOptions } from "./config";
import type { AuthAdapterOptions, LoginSettings, PrivateKeyProvider } from "./interface";

export type AuthLoginParams = LoginParams & {
  // to maintain backward compatibility
  login_hint?: string;
};

export class AuthAdapter extends BaseAdapter<AuthLoginParams> {
  readonly name: string = WALLET_ADAPTERS.AUTH;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public authInstance: Auth | null = null;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  public privateKeyProvider: PrivateKeyProvider | null = null;

  private authOptions: AuthAdapterOptions["adapterSettings"];

  private loginSettings: LoginSettings = { loginProvider: "" };

  private walletSettings: WsEmbedParams = {};

  private wsEmbedInstance: WsEmbed | null = null;

  constructor(params: AuthAdapterOptions = {}) {
    super(params);
    this.setAdapterSettings({
      ...params.adapterSettings,
      chainConfig: params.chainConfig,
      clientId: params.clientId || "",
      sessionTime: params.sessionTime,
      web3AuthNetwork: params.web3AuthNetwork,
      useCoreKitKey: params.useCoreKitKey,
    });
    this.loginSettings = params.loginSettings || { loginProvider: "" };
    this.walletSettings = params.walletSettings || {};
  }

  get chainConfigProxy(): CustomChainConfig | null {
    return this.chainConfig ? { ...this.chainConfig } : null;
  }

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY) {
      if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155 && this.wsEmbedInstance?.provider) {
        return this.wsEmbedInstance.provider;
      }
      if (this.currentChainNamespace !== CHAIN_NAMESPACES.EIP155 && this.privateKeyProvider) {
        return this.privateKeyProvider;
      }
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.clientId) throw WalletInitializationError.invalidParams("clientId is required before auth's initialization");
    if (!this.authOptions) throw WalletInitializationError.invalidParams("authOptions is required before auth's initialization");
    const isRedirectResult = this.authOptions.uxMode === UX_MODE.REDIRECT;

    this.authOptions = {
      ...this.authOptions,
      replaceUrlOnRedirect: isRedirectResult,
      useCoreKitKey: this.useCoreKitKey,
    };
    this.authInstance = new Auth({
      ...this.authOptions,
      clientId: this.clientId,
      network: this.authOptions.network || this.web3AuthNetwork || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    });
    log.debug("initializing auth adapter init");

    await this.authInstance.init();

    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");

    if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { default: WsEmbed } = await import("@web3auth/ws-embed");
      this.wsEmbedInstance = new WsEmbed({
        web3AuthClientId: this.authOptions.clientId || "",
        web3AuthNetwork: this.authOptions.network,
        // modalZIndex: 10000, TODO: turn this into an optional parameter
      });
      await this.wsEmbedInstance.init({
        ...this.walletSettings,
        chainConfig: this.chainConfig as EthereumProviderConfig,
        whiteLabel: {
          ...this.authOptions.whiteLabel,
          ...this.walletSettings.whiteLabel,
        },
        // TODO: add more options
      });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      // TODO: once WS supports solana, we can use it here
      const { SolanaPrivateKeyProvider } = await import("@/core/solana-provider");
      this.privateKeyProvider = new SolanaPrivateKeyProvider({
        config: { chainConfig: this.chainConfig },
      });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.XRPL) {
      const { XrplPrivateKeyProvider } = await import("@/core/xrpl-provider");
      this.privateKeyProvider = new XrplPrivateKeyProvider({
        config: { chainConfig: this.chainConfig },
      });
    } else {
      const { CommonPrivateKeyProvider } = await import("@/core/base-provider");
      this.privateKeyProvider = new CommonPrivateKeyProvider({
        config: { chainConfig: this.chainConfig },
      });
    }
    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.AUTH);

    try {
      log.debug("initializing auth adapter");
      const { sessionId } = this.authInstance || {};
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (sessionId && (options.autoConnect || isRedirectResult)) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached auth provider", error);
      this.emit(ADAPTER_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect(params: AuthLoginParams = { loginProvider: "" }): Promise<IProvider | null> {
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
    return {
      idToken: userInfo.idToken as string,
    };
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");
    const userInfo = this.authInstance.getUserInfo();
    return userInfo;
  }

  // should be called only before initialization.
  setAdapterSettings(adapterSettings: Partial<AuthOptions & BaseAdapterSettings>): void {
    super.setAdapterSettings(adapterSettings);
    const defaultOptions = getAuthDefaultOptions();
    log.info("setting adapter settings", adapterSettings);
    this.authOptions = deepmerge.all([
      defaultOptions.adapterSettings,
      this.authOptions || {},
      adapterSettings || {},
    ]) as AuthAdapterOptions["adapterSettings"];
    if (adapterSettings.web3AuthNetwork) {
      this.authOptions.network = adapterSettings.web3AuthNetwork;
    }
  }

  // TODO: we will no longer need this
  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    // this.privateKeyProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    // TODO: need to check switching to a different chain namespace
    if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      await this.wsEmbedInstance.provider?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: params.chainId }],
      });
    } else {
      await this.privateKeyProvider?.switchChain(params);
    }
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  private _getFinalPrivKey() {
    if (!this.authInstance) return "";
    let finalPrivKey = this.authInstance.privKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.useCoreKitKey) {
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

  private _getFinalEd25519PrivKey() {
    if (!this.authInstance) return "";
    let finalPrivKey = this.authInstance.ed25519PrivKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.useCoreKitKey) {
      // this is to check if the user has already logged in but coreKitKey is not available.
      // when useCoreKitKey is set to true.
      // This is to ensure that when there is no user session active, we don't throw an exception.
      if (this.authInstance.ed25519PrivKey && !this.authInstance.coreKitEd25519Key) {
        throw WalletLoginError.coreKitKeyNotFound();
      }
      finalPrivKey = this.authInstance.coreKitEd25519Key;
    }
    return finalPrivKey;
  }

  private async connectWithProvider(params: AuthLoginParams = { loginProvider: "" }): Promise<void> {
    if (!this.authInstance) throw WalletInitializationError.notReady("authInstance is not ready");

    const keyAvailable = this.authInstance?.sessionId;
    // if not logged in then login
    if (!keyAvailable || params.extraLoginOptions?.id_token) {
      if (!this.loginSettings.curve) {
        this.loginSettings.curve =
          this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA ? SUPPORTED_KEY_CURVES.ED25519 : SUPPORTED_KEY_CURVES.SECP256K1;
      }
      if (!params.loginProvider && !this.loginSettings.loginProvider)
        throw WalletInitializationError.invalidParams("loginProvider is required for login");
      await this.authInstance.login(
        deepmerge.all([
          this.loginSettings,
          params,
          {
            extraLoginOptions: { ...(params.extraLoginOptions || {}), login_hint: params.login_hint || params.extraLoginOptions?.login_hint },
          },
        ]) as AuthLoginParams
      );
    }

    if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
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
        }
      }
    } else {
      let finalPrivKey = this._getFinalPrivKey();
      if (finalPrivKey) {
        if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
          finalPrivKey = this._getFinalEd25519PrivKey();
        }

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
