import OpenLogin, { getHashQueryParams, OPENLOGIN_NETWORK, OpenLoginOptions } from "@toruslabs/openlogin";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
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
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import merge from "lodash.merge";
import log from "loglevel";

import { getOpenloginDefaultOptions } from "./config";
import type { LoginSettings, OpenloginAdapterOptions } from "./interface";

export interface OpenloginLoginParams {
  login_hint: string;
  loginProvider: string;
}

type ProviderFactory = BaseProvider<BaseProviderConfig, BaseProviderState, string>;

export class OpenloginAdapter extends BaseAdapter<OpenloginLoginParams> {
  readonly name: string = WALLET_ADAPTERS.OPENLOGIN;

  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public openloginInstance: OpenLogin | null = null;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider: SafeEventEmitterProvider | null = null;

  public currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  private openloginOptions: OpenLoginOptions;

  private loginSettings: LoginSettings = {};

  private providerFactory: ProviderFactory | null = null;

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
    this.loginSettings = { ...defaultOptions.loginSettings, ...params.loginSettings };
    // if no chainNamespace is passed then chain config should be set before calling init
    if (params.chainConfig?.chainNamespace) {
      this.currentChainNamespace = params.chainConfig?.chainNamespace;
      const defaultChainIdConfig = defaultOptions.chainConfig ? defaultOptions.chainConfig : {};
      this.chainConfig = { ...defaultChainIdConfig, ...params?.chainConfig };
      log.debug("const openlogin chainConfig", this.chainConfig);
      if (!this.chainConfig.rpcTarget) {
        throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
      }
    }
  }

  get chainConfigProxy(): CustomChainConfig | undefined {
    return this.chainConfig ? { ...this.chainConfig } : undefined;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    super.checkInitializationRequirements();
    if (!this.openloginOptions?.clientId) throw WalletInitializationError.invalidParams("clientId is required before openlogin's initialization");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    this.openloginInstance = new OpenLogin(this.openloginOptions);
    const redirectResult = getHashQueryParams();
    let isRedirectResult = true;
    if (Object.keys(redirectResult).length > 0 && redirectResult.result) {
      isRedirectResult = true;
    }
    await this.openloginInstance.init();

    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_STATUS.READY, WALLET_ADAPTERS.OPENLOGIN);

    try {
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (this.openloginInstance.privKey && (options.autoConnect || isRedirectResult)) {
        await this.connect();
      }
    } catch (error) {
      log.error("Failed to connect with cached openlogin provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params?: OpenloginLoginParams): Promise<void> {
    super.checkConnectionRequirements();
    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_STATUS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.OPENLOGIN });
    try {
      await this.connectWithProvider(params);
      return;
    } catch (error) {
      // ready again to be connected
      this.status = ADAPTER_STATUS.READY;
      this.emit(ADAPTER_STATUS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with openlogin");
    }
  }

  async disconnect(): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");
    await this.openloginInstance.logout();
    // ready to be connected again
    this.status = ADAPTER_STATUS.READY;
    this.provider = null;
    this.emit(ADAPTER_STATUS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");
    const userInfo = await this.openloginInstance.getUserInfo();
    return userInfo;
  }

  // should be called only before initialization.
  setAdapterSettings(adapterSettings: OpenLoginOptions): void {
    if (this.status === ADAPTER_STATUS.READY) return;
    const defaultOptions = getOpenloginDefaultOptions();
    this.openloginOptions = { ...defaultOptions.adapterSettings, ...adapterSettings };
  }

  // should be called only before initialization.
  setChainConfig(customChainConfig: CustomChainConfig): void {
    super.setChainConfig(customChainConfig);
    this.currentChainNamespace = customChainConfig.chainNamespace;
  }

  private async connectWithProvider(params?: OpenloginLoginParams): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");

    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaPrivateKeyProvider } = await import("@web3auth/solana-provider");
      this.providerFactory = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
      this.providerFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
    // if not logged in then login
    if (!this.openloginInstance.privKey && params) {
      await this.openloginInstance.login(
        merge(this.loginSettings, { loginProvider: params.loginProvider }, { extraLoginOptions: { login_hint: params?.login_hint } })
      );
    }
    let finalPrivKey = this.openloginInstance.privKey;
    if (finalPrivKey) {
      if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
        const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
        finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
      }
      this.provider = await this.providerFactory.setupProvider(finalPrivKey);
      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.OPENLOGIN, reconnected: !params } as CONNECTED_EVENT_DATA);
    } else {
      throw WalletLoginError.connectionError("Failed to connect with openlogin");
    }
  }
}
