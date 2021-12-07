import type openlogin from "@toruslabs/openlogin";
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
import type { EthereumProvider } from "@web3auth/ethereum-provider";
import type { SolanaProvider } from "@web3auth/solana-provider";

import type { LoginSettings, OpenLoginOptions } from "./interface";

interface OpenloginAdapterOptions {
  chainConfig: CustomChainConfig;
  adapterSettings: OpenLoginOptions;
  loginSettings?: LoginSettings;
}
class OpenloginAdapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.MULTICHAIN;

  readonly currentChainNamespace: ChainNamespaceType;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.IN_APP;

  public openloginInstance: openlogin;

  public connecting: boolean;

  public ready: boolean;

  public connected: boolean;

  public provider: SafeEventEmitterProvider;

  private openloginOptions: Partial<OpenLoginOptions> & Pick<OpenLoginOptions, "clientId" | "network">;

  private loginSettings: LoginSettings = {};

  private chainConfig: CustomChainConfig;

  private solanaProviderFactory: SolanaProvider;

  private ethereumProviderFactory: EthereumProvider;

  constructor(params: OpenloginAdapterOptions) {
    super();
    this.openloginOptions = params.adapterSettings;
    this.loginSettings = params.loginSettings;
    this.currentChainNamespace = params.chainConfig.chainNamespace;
    this.chainConfig = params.chainConfig;
  }

  async init(): Promise<void> {
    if (this.ready) return;
    const { default: OpenloginSdk } = await import("@toruslabs/openlogin");
    this.openloginInstance = new OpenloginSdk(this.openloginOptions);
    await this.openloginInstance.init();
    if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { SolanaProvider } = await import("@web3auth/solana-provider");
      this.solanaProviderFactory = new SolanaProvider({ config: { chainConfig: this.chainConfig } });
      await this.solanaProviderFactory.init();
    } else if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      const { EthereumProvider } = await import("@web3auth/ethereum-provider");
      this.ethereumProviderFactory = new EthereumProvider({ config: { chainConfig: this.chainConfig } });
      await this.ethereumProviderFactory.init();
    } else {
      throw new Error(`Invalid chainNamespace: ${this.chainConfig.chainNamespace} found while connecting to wallet`);
    }
    this.ready = true;
  }

  async connect(params?: CommonLoginOptions): Promise<SafeEventEmitterProvider | null> {
    if (!this.ready) throw new WalletNotReadyError("Openlogin wallet adapter is not ready, please init first");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING);
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
    await this.openloginInstance.logout();
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    const userInfo = await this.openloginInstance.getUserInfo();
    return userInfo;
  }

  private async _login(params?: CommonLoginOptions): Promise<SafeEventEmitterProvider | null> {
    let providerFactory: SolanaProvider | EthereumProvider;
    if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      providerFactory = this.solanaProviderFactory;
    } else if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      providerFactory = this.ethereumProviderFactory;
    } else {
      throw new Error(`Invalid chainNamespace: ${this.chainConfig.chainNamespace} found while connecting to wallet`);
    }

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
        try {
          const privateKey = this.openloginInstance.privKey;
          if (!privateKey) {
            await this.openloginInstance.login({ ...this.loginSettings, ...params, extraLoginOptions: { login_hint: params?.loginHint } });
          }
          let finalPrivKey = this.openloginInstance.privKey;
          if (finalPrivKey) {
            if (this.chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) finalPrivKey = getED25519Key(privateKey).sk.toString("hex");
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
        const provider = await getProvider();
        this.connected = true;
        this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.OPENLOGIN_WALLET);
        resolve(provider);
        return;
      }
      providerFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        const provider = await getProvider();
        if (provider) {
          this.connected = true;
          this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.OPENLOGIN_WALLET);
        }
        // provider can be null in redirect mode
        resolve(provider);
      });
      providerFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
        this.emit(BASE_WALLET_EVENTS.ERRORED, error);
        reject(error);
      });
    });
  }
}

export { OpenloginAdapter, OpenloginAdapterOptions };
