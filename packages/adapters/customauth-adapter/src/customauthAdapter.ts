import type CustomAuth from "@toruslabs/customauth";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
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

import { getCustomAuthDefaultOptions } from "./config";
import CustomAuthStore from "./customAuthStore";
import type { CustomAuthAdapterOptions, CustomAuthArgs, CustomAuthResult, InitParams, LOGIN_TYPE, LoginSettings } from "./interface";
import { parseDirectAuthResult, parseTriggerLoginResult } from "./utils";

type ProviderFactory = BaseProvider<BaseProviderConfig, BaseProviderState, string>;

interface LoginParams {
  email: string;
  loginProvider: string;
}

const DEFAULT_CUSTOM_AUTH_RES: CustomAuthResult = {
  publicAddress: "",
  privateKey: "",
  metadataNonce: "",
  email: "",
  name: "",
  profileImage: "",
  aggregateVerifier: "",
  verifier: "",
  verifierId: "",
  typeOfLogin: "google",
  typeOfUser: "v1",
};

class CustomAuthAdapter extends BaseAdapter<LoginParams> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  // should be overrided in contructor or from setChainConfig function
  // before calling init function.
  public currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  public customAuthInstance!: CustomAuth;

  public connecting = false;

  public ready = false;

  public connected = false;

  public provider!: SafeEventEmitterProvider | undefined;

  public readonly loginSettings: LoginSettings;

  private adapterSettings: CustomAuthArgs | undefined;

  private initSettings: InitParams;

  private providerFactory!: ProviderFactory;

  private store: CustomAuthStore;

  private customAuthResult: CustomAuthResult = {
    ...DEFAULT_CUSTOM_AUTH_RES,
  };

  constructor(params: CustomAuthAdapterOptions) {
    super();
    if (!params.loginSettings) {
      throw WalletInitializationError.invalidParams("loginSettings is required for customAuth adapter");
    }
    const defaultOptions = getCustomAuthDefaultOptions(params.chainConfig?.chainNamespace, params.chainConfig?.chainId);

    const adapterSettings = { ...defaultOptions.adapterSettings, ...params.adapterSettings };
    const loginSettings = { ...params.loginSettings };
    const initSettings = { ...defaultOptions.initSettings, ...params.initSettings };

    if (!adapterSettings.baseUrl) {
      throw WalletInitializationError.invalidParams("baseUrl is required in adapter settings");
    }
    if (!adapterSettings.redirectPathName) {
      throw WalletInitializationError.invalidParams("redirectPathName is required in adapter settings");
    }
    this.adapterSettings = adapterSettings as CustomAuthArgs;
    this.loginSettings = loginSettings;
    this.initSettings = initSettings;

    if (params.chainConfig?.chainNamespace) {
      this.currentChainNamespace = params.chainConfig?.chainNamespace;
    }
    const defaultChainIdConfig = defaultOptions.chainConfig ? defaultOptions.chainConfig : {};
    this.chainConfig = { ...defaultChainIdConfig, ...(params?.chainConfig || {}) } as CustomChainConfig;
    if (!this.chainConfig.rpcTarget) {
      throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    }

    this.store = CustomAuthStore.getInstance();
    this.customAuthResult = { ...this.customAuthResult, ...this.store.getStore() };
  }

  // should be called only before initialization.
  setChainConfig(customChainConfig: CustomChainConfig): void {
    if (this.ready) return;
    log.debug("setting chain config", customChainConfig);
    this.chainConfig = { ...customChainConfig };
    this.currentChainNamespace = customChainConfig.chainNamespace;
  }

  // should be called only before initialization.
  setAdapterSettings(adapterSettings: CustomAuthArgs): void {
    if (this.ready) return;
    const defaultOptions = getCustomAuthDefaultOptions();
    this.adapterSettings = { ...defaultOptions.adapterSettings, ...adapterSettings };
  }

  async init(options: AdapterInitOptions): Promise<void> {
    if (this.ready) return;
    if (!this.adapterSettings) throw WalletInitializationError.invalidParams("adapterSettings is required for customAuth adapter");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required for customAuth adapter");
    const { default: Customauth } = await import("@toruslabs/customauth");
    this.customAuthInstance = new Customauth(this.adapterSettings);
    await this.customAuthInstance.init(this.initSettings);
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaPrivateKeyProvider } = await import("@web3auth/solana-provider");
      this.providerFactory = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
      this.providerFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
    this.ready = true;
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.CUSTOM_AUTH);

    try {
      // if adapter is already connected and cached then we can proceed to setup the provider
      if (this.customAuthResult.privateKey && options.autoConnect) {
        await this.setupProvider(this.providerFactory);
      }
      // if adapter is not connected then we should check if url contains redirect login result
      if (!this.customAuthResult.privateKey) {
        await this.setupProviderWithRedirectResult(this.providerFactory);
      }
    } catch (error) {
      log.error("Failed to parse direct auth result", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params?: LoginParams): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("CustomAuth wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.CUSTOM_AUTH });
    try {
      await this.setupProvider(this.providerFactory, params);
      return;
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      log.error("Error while connecting to custom auth", error);
      throw WalletLoginError.connectionError("Failed to login with CustomAuth");
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    this.store.resetStore();
    this.connected = false;
    this.provider = undefined;
    this.customAuthResult = {
      ...DEFAULT_CUSTOM_AUTH_RES,
    };
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {
      email: this.customAuthResult.email,
      name: this.customAuthResult.name,
      profileImage: this.customAuthResult.profileImage,
      verifier: this.customAuthResult.verifier,
      verifierId: this.customAuthResult.verifierId,
    };
  }

  private async setupProviderWithRedirectResult(providerFactory: ProviderFactory): Promise<void> {
    const url = new URL(window.location.href);
    const hash = url.hash.substring(1);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    if (!hash && Object.keys(queryParams).length === 0) {
      this.ready = true;
      return;
    }
    const redirectResult = await this.customAuthInstance.getRedirectResult({
      replaceUrl: true,
      clearLoginDetails: true,
    });
    if (redirectResult.error) {
      log.error("Failed to parse direct auth result", redirectResult.error);
      if (redirectResult.error !== "Unsupported method type") {
        this.ready = true;
        return;
      }
      this.emit("ERRORED", redirectResult.error);
      return;
    }
    this.customAuthResult = parseDirectAuthResult(redirectResult);
    this._syncCustomauthResult(this.customAuthResult as Record<string, any>);
    if (this.customAuthResult.privateKey) {
      await this.setupProvider(providerFactory);
    }
  }

  private async setupProvider(providerFactory: ProviderFactory, params?: LoginParams): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const connectWithProvider = async (): Promise<void> => {
        const listener = ({ reason }: { reason: Error }) => {
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
        // if user is already logged in.
        let finalPrivKey = this.customAuthResult?.privateKey;
        try {
          if (!finalPrivKey && params) {
            if (!this.loginSettings?.loginProviderConfig?.[params.loginProvider]) {
              throw new Error(`Login provider ${params.loginProvider} settings not found in loginSettings`);
            }
            const result = await this.customAuthInstance.triggerLogin({
              ...this.loginSettings?.loginProviderConfig?.[params.loginProvider],
              typeOfLogin: params.loginProvider as LOGIN_TYPE,
            });
            if (this.adapterSettings?.uxMode === "popup") {
              const parsedResult = parseTriggerLoginResult(result);
              this._syncCustomauthResult(parsedResult as Record<string, any>);
              finalPrivKey = parsedResult.privateKey;
            }
            return;
          }
          if (finalPrivKey) {
            if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
            this.provider = await providerFactory.setupProvider(finalPrivKey);
            return;
          }
          return;
        } catch (err: unknown) {
          listener({ reason: err as Error });
          throw err;
        } finally {
          window.removeEventListener("unhandledrejection", listener);
        }
      };
      await connectWithProvider();
      if (this.provider) {
        this.connected = true;
        this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.CUSTOM_AUTH);
      }
      resolve();
    });
  }

  private _syncCustomauthResult(result?: Record<string, unknown>): void {
    if (result) {
      Object.keys(result).forEach((key: string) => {
        if (typeof result[key] === "string") {
          this.store.set(key, result[key] as string);
        }
      });
      this.customAuthResult = { ...this.customAuthResult, ...result };
    }
  }
}

export { CustomAuthAdapter as CustomauthAdapter };
