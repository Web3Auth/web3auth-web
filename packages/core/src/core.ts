import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  ADAPTER_CATEGORY,
  ADAPTER_NAMESPACES,
  BASE_WALLET_EVENTS,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CommonLoginOptions,
  DuplicateWalletAdapterError,
  IncompatibleChainNamespaceError,
  IWalletAdapter,
  LoginMethodConfig,
  SafeEventEmitterProvider,
  Wallet,
  WalletNotConnectedError,
  WalletNotFoundError,
} from "@web3auth/base";
import { LOGIN_MODAL_EVENTS, LoginModal } from "@web3auth/ui";

import { defaultEvmAggregatorConfig, defaultSolanaAggregatorConfig } from "./config";
import { WALLET_ADAPTER_TYPE } from "./constants";
import { AggregatorModalConfig } from "./interface";
import { getModule } from "./utils";
export class Web3Auth extends SafeEventEmitter {
  readonly chainNamespace: ChainNamespaceType;

  public connectedAdapter: IWalletAdapter | undefined;

  public connected: boolean;

  public connecting: boolean;

  public initialized: boolean;

  public provider: SafeEventEmitterProvider;

  public cachedWallet: string;

  private walletAdapters: Record<string, IWalletAdapter> = {};

  private aggregatorModalConfig: AggregatorModalConfig;

  private loginModal: LoginModal;

  constructor(modalConfig?: AggregatorModalConfig) {
    super();
    this.cachedWallet = window.localStorage.getItem("Web3Auth-CachedWallet");
    this.chainNamespace = modalConfig.chainNamespace;
    let defaultConfig = {};
    if (this.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      defaultConfig = defaultSolanaAggregatorConfig;
    } else if (this.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      defaultConfig = defaultEvmAggregatorConfig;
    } else {
      throw new Error(`Invalid chainspace provided: ${this.chainNamespace}`);
    }
    this.aggregatorModalConfig.chainNamespace = modalConfig.chainNamespace;
    this.aggregatorModalConfig.adapters = {};
    const defaultAdapterKeys = Object.keys(defaultConfig);
    defaultAdapterKeys.forEach((adapterKey) => {
      if (modalConfig.adapters[adapterKey]) {
        this.aggregatorModalConfig.adapters[adapterKey] = { ...defaultConfig[adapterKey], ...modalConfig.adapters[adapterKey] };
      } else {
        this.aggregatorModalConfig.adapters[adapterKey] = defaultConfig[adapterKey];
      }
    });
    this.loginModal = new LoginModal({ appLogo: "", version: "", adapterListener: this.on.bind(this) });
  }

  public async init(): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");
    const customAddedAdapters = Object.keys(this.walletAdapters);
    if (customAddedAdapters.length > 0) {
      // custom ui adapters
      await Promise.all(customAddedAdapters.map((walletName) => this.walletAdapters[walletName].init()));
    } else {
      // default modal adapters
      const defaultAdaptersKeys = Object.keys(this.aggregatorModalConfig.adapters);
      const adapterPromises = [];
      // todo: check if any supported injected provider is available then add it in adapter list
      defaultAdaptersKeys.forEach(async (walletName) => {
        const adapterPromise = new Promise((resolve, reject) => {
          const currentAdapterConfig = this.aggregatorModalConfig.adapters[walletName];
          if (!currentAdapterConfig.visible) return;
          // TODO: add mobile and desktop visibility check
          getModule(walletName, currentAdapterConfig.options)
            .then(async (adapter: IWalletAdapter) => {
              const adapterAlreadyExists = this.walletAdapters[walletName];
              if (adapterAlreadyExists) resolve(true);
              if (adapter.namespace !== ADAPTER_NAMESPACES.MULTICHAIN && adapter.namespace !== this.chainNamespace) {
                reject(
                  new IncompatibleChainNamespaceError(
                    `This wallet adapter belongs to ${adapter.namespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
                  )
                );
                return;
              }
              if (adapter.namespace === ADAPTER_NAMESPACES.MULTICHAIN && this.chainNamespace !== adapter.currentChainNamespace) {
                reject(
                  new IncompatibleChainNamespaceError(
                    `${walletName} wallet adapter belongs to ${adapter.currentChainNamespace} which is incompatible with currently used namespace: ${this.chainNamespace}`
                  )
                );
                return;
              }
              // only intialize default login modals to use in app wallets here.
              if (adapter.walletType === ADAPTER_CATEGORY.IN_APP) {
                await adapter.init();
              }

              this.walletAdapters[walletName] = adapter;
              resolve(true);
              return true;
            })
            .catch((err) => {
              reject(err);
            });
        });
        adapterPromises.push(adapterPromise);
      });
      await Promise.all(adapterPromises);
      this.loginModal.init();
      // todo: add social logins to modal
      // this.loginModal.addSocialLogins()
      this.subsribeToLoginModalEvents(this.loginModal);
    }
    this.initialized = true;
  }

  public addWallet(wallet: Wallet): Web3Auth {
    if (this.initialized) throw new Error("Wallets cannot be added after initialization");

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
    return this;
  }

  public clearCache() {
    window.localStorage.removeItem("Web3Auth-CachedWallet");
    this.cachedWallet = undefined;
  }

  public connect() {
    if (!this.loginModal.initialized) throw new Error("Login modal is not initialized");
    this.loginModal.showModal();
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

  private async initExternalWalletAdapters(): Promise<void> {
    const adapterPromises = [];
    const adaptersConfig: Record<string, LoginMethodConfig> = {};
    Object.keys(this.walletAdapters).forEach(async (walletName) => {
      const adapter = this.walletAdapters[walletName];
      if (adapter?.walletType === ADAPTER_CATEGORY.EXTERNAL) {
        adaptersConfig[walletName] = this.aggregatorModalConfig[walletName]?.options?.loginSettings;
        adapterPromises.push(adapter.init());
      }
    });
    if (adapterPromises.length > 0) await Promise.all(adapterPromises);
    this.loginModal.addWalletLogins(adaptersConfig);
  }

  private subsribeToLoginModalEvents(loginModal: LoginModal): void {
    loginModal.on(LOGIN_MODAL_EVENTS.LOGIN, async (adapter: WALLET_ADAPTER_TYPE, loginParams: CommonLoginOptions) => {
      await this.connectTo(adapter, loginParams);
    });
    loginModal.on(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, async () => {
      await this.initExternalWalletAdapters();
    });
  }

  private cacheWallet(walletName: string) {
    window.localStorage.setItem("Web3Auth-CachedWallet", walletName);
    this.cachedWallet = walletName;
  }
}
