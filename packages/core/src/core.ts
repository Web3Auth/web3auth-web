import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  ADAPTER_CATEGORY,
  ADAPTER_NAMESPACES,
  BASE_WALLET_EVENTS,
  BaseAdapterConfig,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CommonLoginOptions,
  DuplicateWalletAdapterError,
  IncompatibleChainNamespaceError,
  IWalletAdapter,
  SafeEventEmitterProvider,
  Wallet,
  WALLET_ADAPTERS,
  WalletNotConnectedError,
  WalletNotFoundError,
} from "@web3auth/base";
import LoginModal from "@web3auth/ui";

import { defaultEvmModalConfig, defaultSolanaModalConfig } from "./config";
import { WALLET_ADAPTER_TYPE } from "./constants";
import { DefaultAdaptersModalConfig, ModalConfig, SocialLoginAdapterConfig } from "./interface";
import { getModule } from "./utils";
export class Web3Auth extends SafeEventEmitter {
  readonly chainNamespace: ChainNamespaceType;

  public connectedAdapter: IWalletAdapter | undefined;

  // public for testing purpose
  public loginModal: LoginModal;

  public connected: boolean;

  public connecting: boolean;

  public initialized: boolean;

  public provider: SafeEventEmitterProvider;

  public cachedWallet: string;

  public inAppLoginAdapter: string;

  private walletAdapters: Record<string, IWalletAdapter> = {};

  private aggregatorModalConfig: DefaultAdaptersModalConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    adapters: {},
  };

  constructor(chainNamespace: ChainNamespaceType) {
    super();
    this.cachedWallet = window.localStorage.getItem("Web3Auth-CachedWallet");
    this.chainNamespace = chainNamespace;
    // const defaultConfig = {};
    if (this.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      this.aggregatorModalConfig = defaultSolanaModalConfig;
    } else if (this.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      this.aggregatorModalConfig = defaultEvmModalConfig;
    } else {
      throw new Error(`Invalid chainspace provided: ${this.chainNamespace}`);
    }
    this.loginModal = new LoginModal({ appLogo: "", version: "", adapterListener: this });
    this.subsribeToLoginModalEvents();
  }

  public async init(params: { intializeDefaultModal?: boolean; modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");
    if (params.intializeDefaultModal) {
      this.loginModal.init();
      if (!this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN_WALLET] && !this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH]) {
        throw new Error(
          `Please configure either ${WALLET_ADAPTERS.CUSTOM_AUTH} or ${WALLET_ADAPTERS.OPENLOGIN_WALLET} adapter using configureAdapter function as it is required in login modal`
        );
      }
      const adapterPromises = [];
      Object.keys(this.aggregatorModalConfig.adapters).forEach(async (adapterName) => {
        const adPromise = new Promise((resolve, reject) => {
          let adapterConfig = this.aggregatorModalConfig.adapters[adapterName];
          const adapter = this.walletAdapters[adapterName];
          if (adapterConfig.configurationRequired && !adapter && params.modalConfig?.[adapterName] !== false) {
            throw new Error(`${adapterName} adapter is required to be configured,
          please use "configureWallet" function to configure it or set "visible" to false 
          if you don't want to use in modal for this adapter in modal config`);
          }

          if (params.modalConfig?.[adapterName]) {
            adapterConfig = { ...adapterConfig, ...params.modalConfig[adapterName] };
          }
          if (adapterConfig.visible) {
            if (!adapter) {
              getModule(adapterName, adapterConfig.options)
                .then(async (ad: IWalletAdapter) => {
                  this.walletAdapters[adapterName] = ad;
                  if (ad.walletType === ADAPTER_CATEGORY.IN_APP) {
                    await ad.init();
                    this.loginModal.addSocialLogins(adapterName, adapterConfig, (adapterConfig as SocialLoginAdapterConfig).loginMethods);
                  }
                  this.aggregatorModalConfig[adapterName] = adapterConfig;
                  resolve(true);
                  return true;
                })
                .catch((err) => reject(err));
            } else if (adapter.walletType === ADAPTER_CATEGORY.IN_APP) {
              adapter
                .init()
                .then(() => {
                  this.loginModal.addSocialLogins(adapterName, adapterConfig, (adapterConfig as SocialLoginAdapterConfig).loginMethods);
                  this.aggregatorModalConfig[adapterName] = adapterConfig;
                  resolve(true);
                  return true;
                })
                .catch((err) => reject(err));
            }
          }
        });
        adapterPromises.push(adPromise);
      });
      await Promise.all(adapterPromises);
    } else {
      await Promise.all(Object.keys(this.walletAdapters).map((adapterName) => this.walletAdapters[adapterName].init()));
    }
    this.initialized = true;
  }

  public configureWallet(wallet: Wallet): Web3Auth {
    if (this.initialized) throw new Error("Wallets cannot be added after initialization");
    if (this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN_WALLET] && wallet.name === WALLET_ADAPTERS.CUSTOM_AUTH) {
      throw new Error(
        `Either ${WALLET_ADAPTERS.OPENLOGIN_WALLET} or ${WALLET_ADAPTERS.CUSTOM_AUTH} can be used, ${WALLET_ADAPTERS.OPENLOGIN_WALLET} adapter already exists.`
      );
    }
    if (this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH] && wallet.name === WALLET_ADAPTERS.OPENLOGIN_WALLET) {
      throw new Error(
        `Either ${WALLET_ADAPTERS.OPENLOGIN_WALLET} or ${WALLET_ADAPTERS.CUSTOM_AUTH} can be used, ${WALLET_ADAPTERS.CUSTOM_AUTH} adapter already exists.`
      );
    }
    const adapterAlreadyExists = this.walletAdapters[wallet.name];
    if (adapterAlreadyExists) throw new DuplicateWalletAdapterError(`Wallet adapter for ${wallet.name} already exists`);
    const adapter = wallet.adapter();
    if (adapter.namespace !== ADAPTER_NAMESPACES.MULTICHAIN && adapter.namespace !== this.chainNamespace)
      throw new IncompatibleChainNamespaceError(
        `This wallet adapter belongs to ${adapter.namespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
      );
    if (adapter.namespace === ADAPTER_NAMESPACES.MULTICHAIN && this.chainNamespace !== adapter.currentChainNamespace)
      throw new IncompatibleChainNamespaceError(
        `${wallet.name} wallet adapter belongs to ${adapter.currentChainNamespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
      );
    this.walletAdapters[wallet.name] = adapter;
    // if (adapter.walletType === ADAPTER_CATEGORY.IN_APP) {
    //   this.inAppLoginAdapter = wallet.name;
    // }
    return this;
  }

  public connect() {
    if (!this.loginModal.initialized) throw new Error("Login modal is not initialized");
    this.loginModal.toggleModal();
  }

  public clearCache() {
    window.localStorage.removeItem("Web3Auth-CachedWallet");
    this.cachedWallet = undefined;
  }

  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  async connectTo(walletName: WALLET_ADAPTER_TYPE, loginParams?: CommonLoginOptions): Promise<void> {
    if (!this.walletAdapters[walletName]) throw new WalletNotFoundError(`Please add wallet adapter for ${walletName} wallet, before connecting`);
    this.subscribeToAdapterEvents(this.walletAdapters[walletName]);
    await this.walletAdapters[walletName].connect(loginParams);
  }

  async logout(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError(`No wallet is connected`);
    await this.connectedAdapter.disconnect();
    this.connectedAdapter.removeAllListeners();
  }

  async getUserInfo(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError(`No wallet is connected`);
    await this.connectedAdapter.getUserInfo();
  }

  private subscribeToAdapterEvents(walletAdapter: IWalletAdapter): void {
    walletAdapter.on(BASE_WALLET_EVENTS.CONNECTED, (connectedAdapter: WALLET_ADAPTER_TYPE) => {
      this.connected = true;
      this.connecting = false;
      this.connectedAdapter = this.walletAdapters[connectedAdapter];
      this.cacheWallet(connectedAdapter);
      this.emit(BASE_WALLET_EVENTS.CONNECTED, connectedAdapter);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.DISCONNECTED, (data) => {
      this.connected = false;
      this.connecting = false;
      this.clearCache();
      this.emit(BASE_WALLET_EVENTS.DISCONNECTED, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.CONNECTING, (data) => {
      this.connecting = true;
      this.emit(BASE_WALLET_EVENTS.CONNECTING, data);
    });
    walletAdapter.on(BASE_WALLET_EVENTS.ERRORED, (data) => {
      this.connecting = false;
      this.emit(BASE_WALLET_EVENTS.ERRORED, data);
    });
  }

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean): Promise<void> {
    if (externalWalletsInitialized) return;
    const adapterPromises = [];
    const adaptersConfig: Record<string, BaseAdapterConfig> = {};
    // eslint-disable-next-line no-console
    console.log("this.walletAdapters) ", this.walletAdapters);
    Object.keys(this.walletAdapters).forEach(async (walletName) => {
      const adapter = this.walletAdapters[walletName];
      if (adapter?.walletType === ADAPTER_CATEGORY.EXTERNAL) {
        adaptersConfig[walletName] = this.aggregatorModalConfig[walletName]?.options;
        adapterPromises.push(adapter.init());
      }
    });
    // eslint-disable-next-line no-console
    console.log("this.promises) ", adapterPromises);
    if (adapterPromises.length > 0) await Promise.all(adapterPromises);
    this.loginModal.addWalletLogins(adaptersConfig);
  }

  private subsribeToLoginModalEvents(): void {
    this.loginModal.on("LOGIN", async (params: { adapter: WALLET_ADAPTER_TYPE; loginParams: CommonLoginOptions }) => {
      await this.connectTo(params.adapter, params.loginParams);
    });
    this.loginModal.on("INIT_EXTERNAL_WALLETS", async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalWalletAdapters(params.externalWalletsInitialized);
    });
  }

  private cacheWallet(walletName: string) {
    window.localStorage.setItem("Web3Auth-CachedWallet", walletName);
    this.cachedWallet = walletName;
  }
}
