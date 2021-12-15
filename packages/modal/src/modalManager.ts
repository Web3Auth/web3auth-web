import {
  ADAPTER_CATEGORY,
  ADAPTER_NAMESPACES,
  BaseAdapterConfig,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CommonLoginOptions,
  DuplicateWalletAdapterError,
  IncompatibleChainNamespaceError,
  IWalletAdapter,
  Wallet,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { getModule, Web3Auth } from "@web3auth/core";
import LoginModal from "@web3auth/ui";

import { defaultEvmModalConfig, defaultSolanaModalConfig } from "./config";
import { WALLET_ADAPTER_TYPE } from "./constants";
import { DefaultAdaptersModalConfig, ModalConfig } from "./interface";
import { getAdapterSocialLogins } from "./utils";

export class Web3AuthModal extends Web3Auth {
  // public for testing purpose
  public loginModal: LoginModal;

  private aggregatorModalConfig: DefaultAdaptersModalConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    adapters: {},
  };

  constructor(chainNamespace: ChainNamespaceType) {
    super(chainNamespace);
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

  public async initModal(params: { modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");
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
        const defaultAdapterConfig = { ...adapterConfig };
        const adapter = this.walletAdapters[adapterName];

        if (params.modalConfig?.[adapterName]) {
          adapterConfig = { ...adapterConfig, ...params.modalConfig[adapterName] };
        }
        // eslint-disable-next-line no-console
        console.log("adapterConfig", adapterConfig, adapter);
        if (!adapter) {
          if (defaultAdapterConfig.configurationRequired) {
            // TODO: add warning
            // eslint-disable-next-line no-console
            console.log(`${adapterName} adapter is required to be configured,
            please use "configureWallet" function to configure it or set "visible" to false
             if you don't want to use in modal for this adapter in modal config`);
            return;
          }
          getModule(adapterName, adapterConfig.options)
            .then(async (ad: IWalletAdapter) => {
              this.walletAdapters[adapterName] = ad;
              if (ad.walletType === ADAPTER_CATEGORY.IN_APP) {
                this.subscribeToAdapterEvents(ad);
                await ad.init({ connect: this.cachedWallet === adapterName });
                this.loginModal.addSocialLogins(adapterName, adapterConfig, getAdapterSocialLogins(adapterName, ad, adapterConfig.loginMethods));
              }
              this.aggregatorModalConfig[adapterName] = adapterConfig;
              resolve(true);
              return true;
            })
            .catch((err) => reject(err));
        } else if (adapter?.walletType === ADAPTER_CATEGORY.IN_APP) {
          this.subscribeToAdapterEvents(adapter);
          adapter
            .init({ connect: this.cachedWallet === adapterName })
            .then(() => {
              this.loginModal.addSocialLogins(adapterName, adapterConfig, getAdapterSocialLogins(adapterName, adapter, adapterConfig.loginMethods));
              this.aggregatorModalConfig[adapterName] = adapterConfig;
              resolve(true);
              return true;
            })
            .catch((err) => reject(err));
        }
      });
      adapterPromises.push(adPromise);
    });
    await Promise.all(adapterPromises);

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

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean): Promise<void> {
    if (externalWalletsInitialized) return;
    const adapterPromises = [];
    const adaptersConfig: Record<string, BaseAdapterConfig> = {};
    // eslint-disable-next-line no-console
    console.log("this.walletAdapters) ", this.walletAdapters);
    Object.keys(this.walletAdapters).forEach(async (walletName) => {
      const adapter = this.walletAdapters[walletName];
      if (adapter?.walletType === ADAPTER_CATEGORY.EXTERNAL) {
        const adPromise = new Promise((resolve, reject) => {
          adapter
            .init({ connect: this.cachedWallet === walletName })
            .then(() => {
              this.subscribeToAdapterEvents(adapter);
              adaptersConfig[walletName] = this.aggregatorModalConfig.adapters[walletName];
              resolve(true);
              return true;
            })
            .catch((err) => reject(err));
        });
        adapterPromises.push(adPromise);
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
}
