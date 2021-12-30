import type openlogin from "@toruslabs/openlogin";
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

import { getOpenloginDefaultOptions } from ".";
import type { LoginSettings, OpenloginAdapterOptions, OpenLoginOptions } from "./interface";

interface LoginParams {
  email: string;
  loginProvider: string;
}
class OpenloginAdapter extends BaseAdapter<LoginParams> {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public openloginInstance: openlogin;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  public currentChainNamespace: ChainNamespaceType;

  private openloginOptions: Partial<OpenLoginOptions> & Pick<OpenLoginOptions, "clientId" | "network">;

  private loginSettings: LoginSettings = {};

  private chainConfig: CustomChainConfig | null;

  private solanaProviderFactory: SolanaPrivKeyProvider;

  private ethereumProviderFactory: EthereumPrivateKeyProvider;

  constructor(params: OpenloginAdapterOptions) {
    super();
    const { clientId } = params.adapterSettings;
    if (!clientId) {
      throw WalletInitializationError.invalidParams("clientId is required");
    }
    const defaultOptions = getOpenloginDefaultOptions(params.chainConfig?.chainNamespace, params.chainConfig?.chainId);
    this.openloginOptions = { ...defaultOptions.adapterSettings, ...params.adapterSettings };
    this.loginSettings = { ...defaultOptions.loginSettings, ...params.loginSettings };
    this.currentChainNamespace = params.chainConfig?.chainNamespace;
    // if no chainNamespace is passed then chain config should be set before calling init
    if (this.currentChainNamespace) {
      const defaultChainIdConfig = defaultOptions.chainConfig ? defaultOptions.chainConfig : {};
      this.chainConfig = { ...defaultChainIdConfig, ...params?.chainConfig };
      if (!this.chainConfig.rpcTarget) {
        throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
      }
    }
  }

  async init(options: AdapterInitOptions): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (this.ready) return;
    const { default: OpenloginSdk, getHashQueryParams } = await import("@toruslabs/openlogin");
    this.openloginInstance = new OpenloginSdk(this.openloginOptions);
    const redirectResult = getHashQueryParams();
    let isRedirectResult = true;
    if (Object.keys(redirectResult).length > 0) {
      isRedirectResult = true;
    }
    await this.openloginInstance.init();
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaPrivKeyProvider } = await import("@web3auth/solana-provider");
      this.solanaProviderFactory = new SolanaPrivKeyProvider({ config: { chainConfig: this.chainConfig } });
      await this.solanaProviderFactory.init();
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
      this.ethereumProviderFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
      await this.ethereumProviderFactory.init();
    } else {
      throw new Error(`Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`);
    }

    this.ready = true;
    this.emit(BASE_ADAPTER_EVENTS.READY, WALLET_ADAPTERS.OPENLOGIN);

    try {
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (this.openloginInstance.privKey && (options.autoConnect || isRedirectResult)) {
        await this.connectWithProvider();
      }
    } catch (error) {
      log.error("Failed to connect with cached openlogin provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params?: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.ready) throw WalletInitializationError.notReady("Openlogin wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_ADAPTER_EVENTS.CONNECTING, { ...params });
    try {
      return await this.connectWithProvider(params);
    } catch (error) {
      this.emit(BASE_ADAPTER_EVENTS.ERRORED, error);
      throw WalletLoginError.connectionError("Failed to login with openlogin");
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet");
    await this.openloginInstance.logout();
    this.connected = false;
    this.provider = undefined;
    this.emit(BASE_ADAPTER_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.openloginInstance.getUserInfo();
    return userInfo;
  }

  updateChainConfig(customChainConfig: CustomChainConfig): void {
    this.chainConfig = { ...customChainConfig };
    this.currentChainNamespace = customChainConfig.chainNamespace;
    // TODO: switch chain in provider as well if provider exists
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
        try {
          if (!this.openloginInstance.privKey && params) {
            await this.openloginInstance.login({
              ...this.loginSettings,
              loginProvider: params.loginProvider,
              extraLoginOptions: { login_hint: params?.email },
            });
          }
          let finalPrivKey = this.openloginInstance.privKey;

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
          this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.OPENLOGIN);
        }
        resolve(this.provider);
        return;
      }
      providerFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        this.provider = await getProvider();
        if (this.provider) {
          this.connected = true;
          this.emit(BASE_ADAPTER_EVENTS.CONNECTED, WALLET_ADAPTERS.OPENLOGIN);
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

  private async connectWithProvider(params?: LoginParams): Promise<SafeEventEmitterProvider | null> {
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

export { OpenloginAdapter };
