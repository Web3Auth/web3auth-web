import {
  ADAPTER_CATEGORY,
  BaseAdapterConfig,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CommonLoginOptions,
  IWalletAdapter,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { getModule, Web3Auth } from "@web3auth/core";
import LoginModal from "@web3auth/ui";
import log from "loglevel";

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
    this.subscribeToLoginModalEvents();
  }

  public async initModal(params: { modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");
    this.loginModal.init();
    // if (!this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN_WALLET] && !this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH]) {
    //   throw new Error(
    //     `Please configure either ${WALLET_ADAPTERS.CUSTOM_AUTH} or ${WALLET_ADAPTERS.OPENLOGIN_WALLET} adapter using configureAdapter function as it is required in login modal`
    //   );
    // }
    const adapterPromises = [];
    let hasInAppWallets = false;
    Object.keys(this.aggregatorModalConfig.adapters).forEach(async (adapterName) => {
      const adPromise = new Promise((resolve, reject) => {
        let adapterConfig = this.aggregatorModalConfig.adapters[adapterName];
        const defaultAdapterConfig = { ...adapterConfig };
        const adapter = this.walletAdapters[adapterName];

        if (params.modalConfig?.[adapterName]) {
          adapterConfig = { ...adapterConfig, ...params.modalConfig[adapterName] };
        }
        log.info("adapterConfig", adapterConfig, adapter);
        if (!adapter) {
          if (defaultAdapterConfig.configurationRequired) {
            if (adapterName === WALLET_ADAPTERS.CUSTOM_AUTH && this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN_WALLET]) {
              resolve(null);
              return;
            }
            if (adapterName === WALLET_ADAPTERS.OPENLOGIN_WALLET && this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH]) {
              resolve(null);
              return;
            }
            log.warn(`${adapterName} adapter is required to be configured,
            please use "configureWallet" function to configure it or set "visible" to false
             if you don't want to use in modal for this adapter in modal config`);
            resolve(null);
            return;
          }
          getModule(adapterName, adapterConfig.options)
            .then(async (ad: IWalletAdapter) => {
              this.walletAdapters[adapterName] = ad;
              if (ad.walletType === ADAPTER_CATEGORY.IN_APP) {
                hasInAppWallets = true;
              }
              if (ad.walletType === ADAPTER_CATEGORY.IN_APP || adapterName === this.cachedWallet) {
                this.subscribeToAdapterEvents(ad);
                await ad.init({ connect: this.cachedWallet === adapterName });
              }
              this.aggregatorModalConfig[adapterName] = adapterConfig;
              resolve(adapterName);
              return true;
            })
            .catch((err) => reject(err));
        } else if (adapter?.walletType === ADAPTER_CATEGORY.IN_APP || adapterName === this.cachedWallet) {
          if (adapter.walletType === ADAPTER_CATEGORY.IN_APP) {
            hasInAppWallets = true;
          }
          this.subscribeToAdapterEvents(adapter);
          adapter
            .init({ connect: this.cachedWallet === adapterName })
            .then(() => {
              this.aggregatorModalConfig[adapterName] = adapterConfig;
              resolve(adapterName);
              return true;
            })
            .catch((err) => reject(err));
        } else {
          // for external wallets, no need to init here
          this.aggregatorModalConfig[adapterName] = adapterConfig;
          resolve(adapterName);
        }
      });
      adapterPromises.push(adPromise);
    });
    if (adapterPromises.length > 0) {
      const adapterInitResults = await Promise.all(
        adapterPromises.map((p) =>
          p.catch((e) => {
            log.info("error while intiiating adapter", e);
            return e;
          })
        )
      );
      // if any in app wallet is present thn only initialize in app wallet or cached wallet in modal
      if (hasInAppWallets) {
        adapterInitResults.forEach((result) => {
          log.info("adapterInitResults", result, this.walletAdapters[result]);
          if (result && !(result instanceof Error)) {
            if (this.walletAdapters[result].walletType === ADAPTER_CATEGORY.IN_APP) {
              this.loginModal.addSocialLogins(
                result,
                this.aggregatorModalConfig[result],
                getAdapterSocialLogins(result, this.walletAdapters[result], this.aggregatorModalConfig[result].loginMethods)
              );
            }
          }
        });
      } else {
        // if no in app wallet is available then initialize external wallets in modal
        await this.initExternalWalletAdapters(false, { showExternalWallets: true });
      }
    }
    this.initialized = true;
  }

  public connect() {
    if (!this.loginModal.initialized) throw new Error("Login modal is not initialized");
    this.loginModal.toggleModal();
  }

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean, options?: { showExternalWallets: boolean }): Promise<void> {
    if (externalWalletsInitialized) return;
    const adapterPromises = [];
    const adaptersConfig: Record<string, BaseAdapterConfig> = {};

    log.info("this.walletAdapters) ", this.walletAdapters);
    Object.keys(this.walletAdapters).forEach(async (walletName) => {
      const adapter = this.walletAdapters[walletName];
      if (adapter?.walletType === ADAPTER_CATEGORY.EXTERNAL) {
        log.info("init external wallet", this.cachedWallet, walletName);
        const adPromise = new Promise((resolve, reject) => {
          this.subscribeToAdapterEvents(adapter);
          adapter
            .init({ connect: this.cachedWallet === walletName })
            .then(() => {
              adaptersConfig[walletName] = this.aggregatorModalConfig.adapters[walletName];
              resolve(walletName);
              return true;
            })
            .catch((err) => reject(err));
        });
        adapterPromises.push(adPromise);
      }
    });

    log.info("this.promises) ", adapterPromises);
    if (adapterPromises.length > 0) {
      const adapterInitResults = await Promise.all(adapterPromises.map((p) => p.catch((e) => e)));
      const finalAdaptersConfig = {};
      adapterInitResults.forEach((result) => {
        if (!(result instanceof Error)) {
          finalAdaptersConfig[result] = adaptersConfig[result];
        }
      });
      this.loginModal.addWalletLogins(adaptersConfig, { ...options });
    }
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on("LOGIN", async (params: { adapter: WALLET_ADAPTER_TYPE; loginParams: CommonLoginOptions }) => {
      await this.connectTo(params.adapter, params.loginParams);
    });
    this.loginModal.on("INIT_EXTERNAL_WALLETS", async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalWalletAdapters(params.externalWalletsInitialized);
    });
    this.loginModal.on("DISCONNECT", async () => {
      await this.logout();
    });
  }
}
