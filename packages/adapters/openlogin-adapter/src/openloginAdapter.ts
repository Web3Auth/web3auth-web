import OpenLogin, { getHashQueryParams } from "@toruslabs/openlogin";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BASE_ADAPTER_EVENTS,
  BaseAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import log from "loglevel";

import { getOpenloginDefaultOptions } from ".";
import type { LoginSettings, OpenloginAdapterOptions, OpenLoginOptions } from "./interface";

export interface OpenloginLoginParams {
  email: string;
  loginProvider: string;
}
type ProviderFactory = BaseProvider<BaseProviderConfig, BaseProviderState, string>;
class OpenloginAdapter extends BaseAdapter<OpenloginLoginParams> {
  readonly name: string = WALLET_ADAPTERS.OPENLOGIN;

  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public openloginInstance: OpenLogin;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public provider: SafeEventEmitterProvider;

  public currentChainNamespace: ChainNamespaceType;

  private openloginOptions: Partial<OpenLoginOptions> & Pick<OpenLoginOptions, "clientId" | "network">;

  private loginSettings: LoginSettings = {};

  private providerFactory: ProviderFactory;

  constructor(params: OpenloginAdapterOptions) {
    super();
    log.debug("const openlogin adapter", params);
    const defaultOptions = getOpenloginDefaultOptions(params.chainConfig?.chainNamespace, params.chainConfig?.chainId);
    this.openloginOptions = { ...defaultOptions.adapterSettings, ...params.adapterSettings };
    this.loginSettings = { ...defaultOptions.loginSettings, ...params.loginSettings };
    this.currentChainNamespace = params.chainConfig?.chainNamespace;
    // if no chainNamespace is passed then chain config should be set before calling init
    if (this.currentChainNamespace) {
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
    if (Object.keys(redirectResult).length > 0) {
      isRedirectResult = true;
    }
    await this.openloginInstance.init();
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaPrivateKeyProvider } = await import("@web3auth/solana-provider");
      this.providerFactory = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
      this.providerFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }

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
      await this.connectWithProvider(this.providerFactory, params);
      return;
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with openlogin");
    }
  }

  async disconnect(): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.openloginInstance.logout();
    this.status = ADAPTER_STATUS.DISCONNECTED;
    this.provider = undefined;
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet");
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
    if (this.status === ADAPTER_STATUS.READY) return;
    this.chainConfig = { ...customChainConfig };
    this.currentChainNamespace = customChainConfig.chainNamespace;
  }

  private async connectWithProvider(providerFactory: ProviderFactory, params?: OpenloginLoginParams): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const getProvider = async (): Promise<SafeEventEmitterProvider | null> => {
        const listener = ({ reason }) => {
          switch (reason?.message?.toLowerCase()) {
            case "user closed popup":
              reason = WalletInitializationError.windowClosed(reason.message);
              break;
            case "unable to open window":
              reason = WalletInitializationError.windowBlocked(reason.message);
              break;
          }
          reject(reason);
        };

        window.addEventListener("unhandledrejection", listener);
        try {
          // if not logged in then login
          if (!this.openloginInstance.privKey && params) {
            await this.openloginInstance.login({
              ...this.loginSettings,
              loginProvider: params.loginProvider,
              extraLoginOptions: { login_hint: params?.email },
            });
          }
          let finalPrivKey = this.openloginInstance.privKey;

          // convert secp256k1 private key to ed25519 private key
          if (finalPrivKey) {
            if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
            return await providerFactory.setupProvider(finalPrivKey);
          }
          return null;
        } catch (err: unknown) {
          listener({ reason: err });
          throw err;
        } finally {
          window.removeEventListener("unhandledrejection", listener);
        }
      };
      this.provider = await getProvider();
      if (this.provider) {
        this.status = ADAPTER_STATUS.CONNECTED;
        this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.OPENLOGIN);
      } else {
        reject(WalletLoginError.connectionError("Failed to connect with openlogin"));
      }
      resolve();
    });
  }
}

export { OpenloginAdapter };
