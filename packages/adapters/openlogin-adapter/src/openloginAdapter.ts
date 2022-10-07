import OpenLogin, {
  getHashQueryParams,
  LoginParams,
  OPENLOGIN_NETWORK,
  OpenLoginOptions,
  SUPPORTED_KEY_CURVES,
  UX_MODE,
} from "@toruslabs/openlogin-mpc";
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
} from "@web3auth-mpc/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth-mpc/base-provider";
import { EthereumSigningProvider } from "@web3auth-mpc/ethereum-provider";
import merge from "lodash.merge";

import { getOpenloginDefaultOptions } from "./config";
import type { LoginSettings, OpenloginAdapterOptions } from "./interface";

export type OpenloginLoginParams = LoginParams & {
  // to maintain backward compatibility
  login_hint?: string;
};

type PrivateKeyOrSigningProvider = IBaseProvider<
  | string
  | {
      sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    }
>;

export class OpenloginAdapter extends BaseAdapter<OpenloginLoginParams> {
  readonly name: string = WALLET_ADAPTERS.OPENLOGIN;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public openloginInstance: OpenLogin | null = null;

  public clientId: string;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  private openloginOptions: OpenLoginOptions;

  private loginSettings: LoginSettings = {};

  private tssSettings?: {
    useTSS: boolean;
    tssSign?: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    tssGetPublic?: () => Promise<Buffer>;
    tssDataCallback?: (
      tssDataReader: () => Promise<{ tssShare: string; signatures: string[]; verifierName: string; verifierId: string }>
    ) => Promise<void>;
  };

  private privateKeyOrSigningProvider: PrivateKeyOrSigningProvider | null = null;

  constructor(params: OpenloginAdapterOptions) {
    super();
    log.debug("const openlogin adapter", params);
    const defaultOptions = getOpenloginDefaultOptions(params.chainConfig?.chainNamespace, params.chainConfig?.chainId);
    this.openloginOptions = {
      clientId: "",
      network: OPENLOGIN_NETWORK.MAINNET,
      ...defaultOptions.adapterSettings,
      ...(params.adapterSettings || {}),
    };
    this.clientId = params.adapterSettings?.clientId as string;
    this.loginSettings = { ...defaultOptions.loginSettings, ...params.loginSettings };
    if (params.tssSettings) {
      this.tssSettings = params.tssSettings;
    }
    this.sessionTime = this.loginSettings.sessionTime || 86400;
    // if no chainNamespace is passed then chain config should be set before calling init
    if (params.chainConfig?.chainNamespace) {
      this.currentChainNamespace = params.chainConfig?.chainNamespace;
      const defaultChainIdConfig = defaultOptions.chainConfig ? defaultOptions.chainConfig : {};
      this.chainConfig = { ...defaultChainIdConfig, ...params?.chainConfig };
      log.debug("const openlogin chainConfig", this.chainConfig);
      if (!this.chainConfig.rpcTarget && params.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
        throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
      }
    }
  }

  get chainConfigProxy(): CustomChainConfig | null {
    return this.chainConfig ? { ...this.chainConfig } : null;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.privateKeyOrSigningProvider?.provider || null;
  }

  set provider(_: SafeEventEmitterProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.openloginOptions?.clientId) throw WalletInitializationError.invalidParams("clientId is required before openlogin's initialization");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    let isRedirectResult = false;

    if (this.openloginOptions.uxMode === UX_MODE.REDIRECT) {
      const redirectResult = getHashQueryParams();
      if (Object.keys(redirectResult).length > 0 && redirectResult._pid) {
        isRedirectResult = true;
      }
    }
    this.openloginOptions = {
      ...this.openloginOptions,
      replaceUrlOnRedirect: isRedirectResult,
    };
    this.openloginInstance = new OpenLogin(this.openloginOptions);
    log.debug("initializing openlogin adapter init");

    await this.openloginInstance.init();

    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.OPENLOGIN);

    try {
      log.debug("initializing openlogin adapter");
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (this.openloginInstance.privKey && (options.autoConnect || isRedirectResult)) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached openlogin provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params?: OpenloginLoginParams): Promise<SafeEventEmitterProvider | null> {
    super.checkConnectionRequirements();
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.OPENLOGIN });
    try {
      if (this.tssSettings?.useTSS) {
        await this.connectWithTSSProvider(params);
      } else {
        await this.connectWithPrivKeyProvider(params);
      }
      return this.provider;
    } catch (error: unknown) {
      log.error("Failed to connect with openlogin provider", error);
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_EVENTS.ERRORED, error);
      if ((error as Error)?.message.includes("user closed popup")) {
        throw WalletLoginError.popupClosed();
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
      this.privateKeyOrSigningProvider = null;
    } else {
      // ready to be connected again
      this.status = ADAPTER_STATUS.READY;
    }

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
  setAdapterSettings(adapterSettings: OpenLoginOptions & { sessionTime: number }): void {
    if (this.status === ADAPTER_STATUS.READY) return;
    const defaultOptions = getOpenloginDefaultOptions();
    this.openloginOptions = { ...defaultOptions.adapterSettings, ...(this.openloginOptions || {}), ...adapterSettings };
    if (adapterSettings.sessionTime) {
      this.loginSettings = { ...this.loginSettings, sessionTime: adapterSettings.sessionTime };
    }
    if (adapterSettings.clientId) {
      this.clientId = adapterSettings.clientId;
    }
  }

  // should be called only before initialization.
  setChainConfig(customChainConfig: CustomChainConfig): void {
    super.setChainConfig(customChainConfig);
    this.currentChainNamespace = customChainConfig.chainNamespace;
  }

  private async connectWithPrivKeyProvider(params?: OpenloginLoginParams): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");

    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaPrivateKeyProvider } = await import("@web3auth-mpc/solana-provider");
      this.privateKeyOrSigningProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth-mpc/ethereum-provider");
      this.privateKeyOrSigningProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.OTHER) {
      this.privateKeyOrSigningProvider = new CommonPrivateKeyProvider();
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
    // if not logged in then login
    if (!this.openloginInstance.privKey && params) {
      if (!this.loginSettings.curve) {
        this.loginSettings.curve =
          this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA ? SUPPORTED_KEY_CURVES.ED25519 : SUPPORTED_KEY_CURVES.SECP256K1;
      }
      await this.openloginInstance.login(
        merge(
          this.loginSettings,
          { loginProvider: params.loginProvider },
          { extraLoginOptions: { ...(params.extraLoginOptions || {}), login_hint: params.login_hint || params.extraLoginOptions?.login_hint } }
        )
      );
    }
    let finalPrivKey = this.openloginInstance.privKey;
    if (finalPrivKey) {
      if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
        const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
        finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
      }
      await this.privateKeyOrSigningProvider.setupProvider(finalPrivKey);
      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.OPENLOGIN, reconnected: !params } as CONNECTED_EVENT_DATA);
    }
  }

  private async connectWithTSSProvider(params?: OpenloginLoginParams): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");
    if (!this.tssSettings) throw new Error("tss settings are undefined");

    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      throw new Error("solana is not supported at the moment for TSS");
      // const { SolanaPrivateKeyProvider } = await import("@web3auth-mpc/solana-provider");
      // this.privKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      this.privateKeyOrSigningProvider = new EthereumSigningProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.OTHER) {
      throw new Error("other chains are not supported at the moment for TSS");
      // this.privKeyProvider = new CommonPrivateKeyProvider();
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
    // if not logged in then login
    if (!this.openloginInstance.privKey && params) {
      if (!this.loginSettings.curve) {
        this.loginSettings.curve = SUPPORTED_KEY_CURVES.SECP256K1;
      }
      await this.openloginInstance.login(
        merge(
          this.loginSettings,
          { loginProvider: params.loginProvider },
          { extraLoginOptions: { ...(params.extraLoginOptions || {}), login_hint: params.login_hint || params.extraLoginOptions?.login_hint } }
        )
      );
    }

    // check if TSS is available
    if (!this.openloginInstance.state.tssShare) {
      throw new Error("TSS share is currently unavailable.");
    }
    if (!Array.isArray(this.openloginInstance.state.signatures) || this.openloginInstance.state.signatures.length === 0) {
      throw new Error("TSS session is currently unavailable.");
    }

    if (!this.tssSettings.tssDataCallback) {
      throw new Error("tss data callback is undefined");
    }
    if (!this.tssSettings.tssSign) {
      throw new Error("sign method is undefined");
    }
    if (!this.tssSettings.tssGetPublic) {
      throw new Error("sign method is undefined");
    }

    await this.tssSettings.tssDataCallback(async () => {
      const userInfo = await this.openloginInstance?.getUserInfo();
      return {
        tssShare: this.openloginInstance?.state.tssShare || "",
        signatures: this.openloginInstance?.state.signatures || [],
        verifierName: userInfo?.aggregateVerifier || userInfo?.verifier || "",
        verifierId: userInfo?.verifierId || "",
      };
    });

    await this.privateKeyOrSigningProvider.setupProvider({
      sign: this.tssSettings.tssSign,
      getPublic: this.tssSettings.tssGetPublic,
    });
    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.OPENLOGIN, reconnected: !params } as CONNECTED_EVENT_DATA);
  }
}
