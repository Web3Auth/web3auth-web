import OpenLogin, { getHashQueryParams, LoginParams, OPENLOGIN_NETWORK, OpenLoginOptions, SUPPORTED_KEY_CURVES, UX_MODE } from "@toruslabs/openlogin";
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
  log,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth/base-provider";
import merge from "lodash.merge";

import { getOpenloginDefaultOptions } from "./config";
import type { LoginSettings, OpenloginAdapterOptions } from "./interface";

export type OpenloginLoginParams = LoginParams & {
  // to maintain backward compatibility
  login_hint?: string;
};

type PrivateKeyProvider = IBaseProvider<string>;

export class OpenloginAdapter extends BaseAdapter<OpenloginLoginParams> {
  readonly name: string = WALLET_ADAPTERS.OPENLOGIN;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public openloginInstance: OpenLogin | null = null;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  private openloginOptions: OpenloginAdapterOptions["adapterSettings"];

  private loginSettings: LoginSettings = { loginProvider: "" };

  private privKeyProvider: PrivateKeyProvider | null = null;

  constructor(params: OpenloginAdapterOptions = {}) {
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
  }

  get chainConfigProxy(): CustomChainConfig | null {
    return this.chainConfig ? { ...this.chainConfig } : null;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.privKeyProvider?.provider || null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.clientId) throw WalletInitializationError.invalidParams("clientId is required before openlogin's initialization");
    if (!this.openloginOptions) throw WalletInitializationError.invalidParams("openloginOptions is required before openlogin's initialization");
    let isRedirectResult = false;

    if (this.openloginOptions.uxMode === UX_MODE.REDIRECT || this.openloginOptions.uxMode === UX_MODE.SESSIONLESS_REDIRECT) {
      const redirectResult = getHashQueryParams();
      if (Object.keys(redirectResult).length > 0 && redirectResult._pid) {
        isRedirectResult = true;
      }
    }
    this.openloginOptions = {
      ...this.openloginOptions,
      replaceUrlOnRedirect: isRedirectResult,
    };
    this.openloginInstance = new OpenLogin({
      ...this.openloginOptions,
      clientId: this.clientId,
      network: this.openloginOptions.network || this.web3AuthNetwork || OPENLOGIN_NETWORK.MAINNET,
    });
    log.debug("initializing openlogin adapter init");

    await this.openloginInstance.init();

    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.OPENLOGIN);

    try {
      log.debug("initializing openlogin adapter");

      const finalPrivKey = this._getFinalPrivKey();
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (finalPrivKey && (options.autoConnect || isRedirectResult)) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached openlogin provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params: OpenloginLoginParams = { loginProvider: "" }): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.OPENLOGIN });
    try {
      await this.connectWithProvider(params);
      return this.provider;
    } catch (error: unknown) {
      log.error("Failed to connect with openlogin provider", error);
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      if ((error as Error)?.message.includes("user closed popup")) {
        throw WalletLoginError.popupClosed();
      } else if (error instanceof Web3AuthError) {
        throw error;
      }
      throw WalletLoginError.connectionError("Failed to login with openlogin");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");
    await this.openloginInstance.logout();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.openloginInstance = null;
      this.privKeyProvider = null;
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
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");
    const userInfo = await this.openloginInstance.getUserInfo();
    return userInfo;
  }

  // should be called only before initialization.
  setAdapterSettings(adapterSettings: Partial<OpenLoginOptions & BaseAdapterSettings>): void {
    super.setAdapterSettings(adapterSettings);
    const defaultOptions = getOpenloginDefaultOptions();
    log.info("setting adapter settings", adapterSettings);
    this.openloginOptions = {
      ...defaultOptions.adapterSettings,
      ...this.openloginOptions,
      ...adapterSettings,
    };
    if (adapterSettings.web3AuthNetwork) {
      this.openloginOptions.network = adapterSettings.web3AuthNetwork;
    }
    if (adapterSettings.useCoreKitKey !== undefined) {
      this.openloginOptions.useCoreKitKey = adapterSettings.useCoreKitKey;
    }
  }

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(init);
    this.privKeyProvider?.addChain(chainConfig);
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.privKeyProvider?.switchChain(params);
    this.setAdapterSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  private _getFinalPrivKey() {
    if (!this.openloginInstance) return "";
    let finalPrivKey = this.openloginInstance.privKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.openloginOptions?.useCoreKitKey) {
      if (!this.openloginInstance.coreKitKey) {
        throw WalletLoginError.coreKitKeyNotFound();
      }
      finalPrivKey = this.openloginInstance.coreKitKey;
    }
    return finalPrivKey;
  }

  private async connectWithProvider(params: OpenloginLoginParams = { loginProvider: "" }): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");

    const keyAvailable = this._getFinalPrivKey();
    // if not logged in then login
    if (!keyAvailable || params.extraLoginOptions?.id_token) {
      if (!this.loginSettings.curve) {
        this.loginSettings.curve =
          this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA ? SUPPORTED_KEY_CURVES.ED25519 : SUPPORTED_KEY_CURVES.SECP256K1;
      }
      if (!params.loginProvider && !this.loginSettings.loginProvider)
        throw WalletInitializationError.invalidParams("loginProvider is required for login");
      await this.openloginInstance.login(
        merge(this.loginSettings, params, {
          extraLoginOptions: { ...(params.extraLoginOptions || {}), login_hint: params.login_hint || params.extraLoginOptions?.login_hint },
        })
      );
    }
    let finalPrivKey = this._getFinalPrivKey();
    if (finalPrivKey) {
      if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
        const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
        finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
      }

      if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
        const { SolanaPrivateKeyProvider } = await import("@web3auth/solana-provider");
        this.privKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
      } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
        const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
        this.privKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
      } else if (this.currentChainNamespace === CHAIN_NAMESPACES.OTHER) {
        this.privKeyProvider = new CommonPrivateKeyProvider();
      } else {
        throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
      }
      await this.privKeyProvider.setupProvider(finalPrivKey);
      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.OPENLOGIN, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
    }
  }
}
