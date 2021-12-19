/* eslint-disable no-console */
// /* eslint-disable no-console */
import type CustomAuth from "@toruslabs/customauth";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CommonLoginOptions,
  CustomChainConfig,
  PROVIDER_EVENTS,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletWindowBlockedError,
  WalletWindowClosedError,
} from "@web3auth/base";
import type { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import type { PrivKeySolanaProvider } from "@web3auth/solana-provider";

import CustomauthStore from "./customAuthStore";
import type { CustomAuthArgs, InitParams, LOGIN_TYPE, LoginSettings, TorusDirectAuthResult } from "./interface";
import { parseDirectAuthResult, parseTriggerLoginResult } from "./utils";
interface CustomauthAdapterOptions {
  chainConfig: CustomChainConfig;
  adapterSettings: CustomAuthArgs;
  initSettings: InitParams;
  loginSettings: LoginSettings;
}
class CustomauthAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly currentChainNamespace: ChainNamespaceType;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public customauthInstance: CustomAuth;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public readonly loginSettings: LoginSettings;

  private adapterSettings: CustomAuthArgs;

  private privKey: string;

  private initSettings: InitParams;

  private chainConfig: CustomChainConfig;

  private solanaProviderFactory: PrivKeySolanaProvider;

  private ethereumProviderFactory: EthereumPrivateKeyProvider;

  private store: CustomauthStore;

  private customAuthResult: TorusDirectAuthResult = {
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

  constructor(params: CustomauthAdapterOptions) {
    super();
    this.adapterSettings = params.adapterSettings;
    this.loginSettings = params.loginSettings;
    this.currentChainNamespace = params.chainConfig.chainNamespace;
    this.chainConfig = params.chainConfig;
    this.initSettings = params.initSettings;
    this.store = CustomauthStore.getInstance();
    this.customAuthResult = { ...this.customAuthResult, ...this.store.getStore() };
  }

  async init(options: { connect: boolean }): Promise<void> {
    if (this.ready) return;
    const { default: Customauth } = await import("@toruslabs/customauth");
    this.customauthInstance = new Customauth(this.adapterSettings);
    let providerFactory: EthereumPrivateKeyProvider | PrivKeySolanaProvider;
    await this.customauthInstance.init(this.initSettings);
    if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { PrivKeySolanaProvider } = await import("@web3auth/solana-provider");
      this.solanaProviderFactory = new PrivKeySolanaProvider({ config: { chainConfig: this.chainConfig } });
      await this.solanaProviderFactory.init();
      providerFactory = this.solanaProviderFactory;
    } else if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
      this.ethereumProviderFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
      await this.ethereumProviderFactory.init();
      providerFactory = this.ethereumProviderFactory;
    } else {
      throw new Error(`Invalid chainNamespace: ${this.chainConfig.chainNamespace} found while connecting to wallet`);
    }
    this.ready = true;
    this.emit(BASE_WALLET_EVENTS.READY, WALLET_ADAPTERS.CUSTOM_AUTH);

    try {
      // if adapter is already connected and cached then we can proceed to setup the provider
      if (this.customAuthResult.privateKey && options.connect) {
        await this.setupProvider(providerFactory);
      }
      // if adapter is not connected then we should check if url contains redirect login result
      if (!this.customAuthResult.privateKey) {
        await this.setupProviderWithRedirectResult(providerFactory);
      }
    } catch (error) {
      console.log("Failed to parse direct auth result", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params?: CommonLoginOptions): Promise<SafeEventEmitterProvider | null> {
    if (!this.ready) throw new WalletNotReadyError("Customauth wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING, { ...params });
    try {
      return await this._login(params);
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
      throw new WalletConnectionError("Failed to login with openlogin", error);
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet");
    this.store.resetStore();
    this.connected = false;
    this.provider = undefined;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    return {
      email: this.customAuthResult.email,
      name: this.customAuthResult.name,
      profileImage: this.customAuthResult.profileImage,
      verifier: this.customAuthResult.verifier,
      verifierId: this.customAuthResult.verifierId,
    };
  }

  private async setupProviderWithRedirectResult(providerFactory: PrivKeySolanaProvider | EthereumPrivateKeyProvider): Promise<void> {
    const url = new URL(window.location.href);
    const hash = url.hash.substr(1);
    const queryParams = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    if (!hash && Object.keys(queryParams).length === 0) {
      this.ready = true;
      return;
    }
    const redirectResult = await this.customauthInstance.getRedirectResult({
      replaceUrl: true,
      clearLoginDetails: true,
    });
    if (redirectResult.error) {
      console.log("Failed to parse direct auth result", redirectResult.error);
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
    providerFactory: PrivKeySolanaProvider | EthereumPrivateKeyProvider,
    params?: CommonLoginOptions
  ): Promise<SafeEventEmitterProvider | null> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      if (providerFactory.state._errored) {
        this.emit(BASE_WALLET_EVENTS.ERRORED, providerFactory.state.error);
        reject(providerFactory.state.error);
        return;
      }
      const getProvider = async (): Promise<SafeEventEmitterProvider | null> => {
        const listener = ({ reason }) => {
          switch (reason?.message?.toLowerCase()) {
            case "user closed popup":
              reason = new WalletWindowClosedError(reason.message, reason);
              break;
            case "unable to open window":
              reason = new WalletWindowBlockedError(reason.message, reason);
              break;
          }
          reject(reason);
        };
        window.addEventListener("unhandledrejection", listener);
        let finalPrivKey = this.customAuthResult.privateKey;
        try {
          if (!finalPrivKey && params) {
            if (!this.loginSettings?.loginProviderConfig?.[params.loginProvider]) {
              throw new Error(`Login provider ${params.loginProvider} settings not found in loginSettings`);
            }
            const result = await this.customauthInstance.triggerLogin({
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
          console.log("setting up provider", finalPrivKey);
          if (finalPrivKey) {
            if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
            console.log("setting up provider 2");
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
        console.log("setting up provider res", this.provider);
        if (this.provider) {
          this.connected = true;
          this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.CUSTOM_AUTH);
        }
        resolve(this.provider);
        return;
      }
      providerFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        this.provider = await getProvider();
        console.log("setting up provider event received", this.provider);
        if (this.provider) {
          this.connected = true;
          this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.CUSTOM_AUTH);
        }
        // provider can be null in redirect mode
        resolve(this.provider);
      });
      providerFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
        this.emit(BASE_WALLET_EVENTS.ERRORED, error);
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

  private async _login(params?: CommonLoginOptions): Promise<SafeEventEmitterProvider | null> {
    let providerFactory: PrivKeySolanaProvider | EthereumPrivateKeyProvider;
    if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      providerFactory = this.solanaProviderFactory;
    } else if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      providerFactory = this.ethereumProviderFactory;
    } else {
      throw new Error(`Invalid chainNamespace: ${this.chainConfig.chainNamespace} found while connecting to wallet`);
    }
    return this.setupProvider(providerFactory, params);
  }
}

export { CustomauthAdapter, CustomauthAdapterOptions };
