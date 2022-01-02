// /* eslint-disable no-console */
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
  PROVIDER_EVENTS,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import type { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import type { SolanaPrivKeyProvider } from "@web3auth/solana-provider";
import log from "loglevel";

import { getCustomAuthDefaultOptions } from ".";
import CustomauthStore from "./customAuthStore";
import type { CustomAuthAdapterOptions, CustomAuthArgs, InitParams, LOGIN_TYPE, LoginSettings, TorusDirectAuthResult } from "./interface";
import { parseDirectAuthResult, parseTriggerLoginResult } from "./utils";
interface LoginParams {
  email: string;
  loginProvider: string;
}

const DEFAULT_CUSTOM_AUTH_RES: TorusDirectAuthResult = {
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
class CustomauthAdapter extends BaseAdapter<LoginParams> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public currentChainNamespace: ChainNamespaceType;

  public customAuthInstance: CustomAuth;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public readonly loginSettings: LoginSettings;

  private adapterSettings: CustomAuthArgs;

  private initSettings: InitParams;

  private chainConfig: CustomChainConfig;

  private solanaProviderFactory: SolanaPrivKeyProvider;

  private ethereumProviderFactory: EthereumPrivateKeyProvider;

  private store: CustomauthStore;

  private customAuthResult: TorusDirectAuthResult = {
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
    this.adapterSettings = adapterSettings;
    this.loginSettings = loginSettings;
    this.initSettings = initSettings;

    this.currentChainNamespace = params.chainConfig?.chainNamespace;
    // if no currentChainNamespace is passed then chain config should be set before calling init
    if (this.currentChainNamespace) {
      const defaultChainIdConfig = defaultOptions.chainConfig ? defaultOptions.chainConfig : {};
      this.chainConfig = { ...defaultChainIdConfig, ...params?.chainConfig };
      if (!this.chainConfig.rpcTarget) {
        throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
      }
    }

    this.store = CustomauthStore.getInstance();
    this.customAuthResult = { ...this.customAuthResult, ...this.store.getStore() };
  }

  // should be called only before initialization.
  setChainConfig(customChainConfig: CustomChainConfig): void {
    if (this.ready) return;
    this.chainConfig = { ...customChainConfig };
    this.currentChainNamespace = customChainConfig.chainNamespace;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    if (this.ready) return;
    const { default: Customauth } = await import("@toruslabs/customauth");
    this.customAuthInstance = new Customauth(this.adapterSettings);
    let providerFactory: EthereumPrivateKeyProvider | SolanaPrivKeyProvider;
    await this.customAuthInstance.init(this.initSettings);
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaPrivKeyProvider } = await import("@web3auth/solana-provider");
      this.solanaProviderFactory = new SolanaPrivKeyProvider({ config: { chainConfig: this.chainConfig } });
      await this.solanaProviderFactory.init();
      providerFactory = this.solanaProviderFactory;
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
      this.ethereumProviderFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
      await this.ethereumProviderFactory.init();
      providerFactory = this.ethereumProviderFactory;
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
    this.ready = true;
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.CUSTOM_AUTH);

    try {
      // if adapter is already connected and cached then we can proceed to setup the provider
      if (this.customAuthResult.privateKey && options.autoConnect) {
        await this.setupProvider(providerFactory);
      }
      // if adapter is not connected then we should check if url contains redirect login result
      if (!this.customAuthResult.privateKey) {
        await this.setupProviderWithRedirectResult(providerFactory);
      }
    } catch (error) {
      log.error("Failed to parse direct auth result", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params?: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.ready) throw WalletInitializationError.notReady("Customauth wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.CUSTOM_AUTH });
    try {
      return await this._login(params);
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      log.error("Error while connecting to custom auth", error);
      throw WalletLoginError.connectionError("Failed to login with openlogin");
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

  private async setupProviderWithRedirectResult(providerFactory: SolanaPrivKeyProvider | EthereumPrivateKeyProvider): Promise<void> {
    const url = new URL(window.location.href);
    const hash = url.hash.substring(1);
    const queryParams = {};
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
    this._syncCustomauthResult(this.customAuthResult);
    if (this.customAuthResult.privateKey) {
      await this.setupProvider(providerFactory);
    }
  }

  private async setupProvider(
    providerFactory: SolanaPrivKeyProvider | EthereumPrivateKeyProvider,
    params?: LoginParams
  ): Promise<SafeEventEmitterProvider | null> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (providerFactory.state._errored) {
        this.emit(BASE_ADAPTER_EVENTS.ERRORED, providerFactory.state.error);
        reject(providerFactory.state.error);
        return;
      }
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
            if (this.adapterSettings.uxMode === "popup") {
              const parsedResult = parseTriggerLoginResult(result);
              this._syncCustomauthResult(parsedResult);
              finalPrivKey = parsedResult.privateKey;
            } else {
              return;
            }
          }
          if (finalPrivKey) {
            if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
            return providerFactory.setupProvider(finalPrivKey);
          }
          return null;
        } catch (err: unknown) {
          listener({ reason: err });
          throw err;
        } finally {
          window.removeEventListener("unhandledrejection", listener);
        }
      };
      if (providerFactory.state._initialized) {
        this.provider = await getProvider();
        if (this.provider) {
          this.connected = true;
          this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.CUSTOM_AUTH);
        }
        resolve(this.provider);
        return;
      }
      providerFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        this.provider = await getProvider();
        if (this.provider) {
          this.connected = true;
          this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.CUSTOM_AUTH);
        }
        // provider can be null in redirect mode
        resolve(this.provider);
      });
      providerFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
        this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
        reject(error);
      });
    });
  }

  private _syncCustomauthResult(result?: TorusDirectAuthResult): void {
    if (result) {
      if (typeof result !== "object") {
        throw new Error("expected store to be an object");
      }
      Object.keys(result).forEach((key) => {
        if (typeof result[key] === "string") {
          this.store.set(key, result[key]);
        }
      });
    }
    this.customAuthResult = { ...this.customAuthResult, ...result };
  }

  private async _login(params?: LoginParams): Promise<SafeEventEmitterProvider | null> {
    let providerFactory: SolanaPrivKeyProvider | EthereumPrivateKeyProvider;
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      providerFactory = this.solanaProviderFactory;
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      providerFactory = this.ethereumProviderFactory;
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }
    return this.setupProvider(providerFactory, params);
  }
}

export { CustomauthAdapter };
