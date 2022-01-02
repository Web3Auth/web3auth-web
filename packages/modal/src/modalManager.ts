import {
  ADAPTER_CATEGORY,
  ADAPTER_NAMESPACES,
  BaseAdapterConfig,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  getChainConfig,
  IAdapter,
  WALLET_ADAPTERS,
  WalletInitializationError,
} from "@web3auth/base";
import { getDefaultAdapterModule, Web3AuthCore } from "@web3auth/core";
import LoginModal, { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import log from "loglevel";

import { defaultEvmDappModalConfig, defaultEvmWalletModalConfig, defaultSolanaDappModalConfig, defaultSolanaWalletModalConfig } from "./config";
import { WALLET_ADAPTER_TYPE } from "./constants";
import { AdaptersModalConfig, ModalConfig } from "./interface";
import { getAdapterSocialLogins } from "./utils";

export interface Web3AuthOptions {
  /**
   * The chain namespace to use. Currently only supports "EIP155" and "SOLANA".
   */
  chainNamespace: ChainNamespaceType;
  /**
   * Numeric chainId for the chainNamespace being used, by default it will be mainnet id for the provided namespace..
   * For ex: it will be ethereum mainnet `1` for "EIP155" and solana mainnet `1` for "SOLANA".
   *
   * @defaultValue mainnnet id of provided chainNamespace
   */
  chainId?: number;

  /**
   * web3auth instance provides different adapters for different type of usages. If you are dapp and want to
   * use external wallets like metamask, then you can use the `DAPP` authMode.
   * If you are a wallet and only want to use you own wallet implementations along with customAuth or openlogin,
   * then you should use `WALLET` authMode.
   *
   * @defaultValue `DAPP`
   */
  authMode?: "DAPP" | "WALLET";
}
export class Web3Auth extends Web3AuthCore {
  // public for testing purpose
  public loginModal: LoginModal;

  private aggregatorModalConfig: AdaptersModalConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    requiredAdapters: {},
    adapters: {},
  };

  constructor(options: Web3AuthOptions) {
    super(options);
    // const defaultConfig = {};
    if (this.options.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (options.authMode === "WALLET") {
        this.aggregatorModalConfig = defaultSolanaWalletModalConfig;
      } else {
        this.aggregatorModalConfig = defaultSolanaDappModalConfig;
      }
    } else if (this.options.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      if (options.authMode === "WALLET") {
        this.aggregatorModalConfig = defaultEvmWalletModalConfig;
      } else {
        this.aggregatorModalConfig = defaultEvmDappModalConfig;
      }
    } else {
      throw new Error(`Invalid chainNamespace provided: ${this.options.chainNamespace}`);
    }
    this.loginModal = new LoginModal({ appLogo: "", version: "", adapterListener: this });
    this.subscribeToLoginModalEvents();
  }

  public async initModal(params: { modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void> {
    if (this.initialized) throw new Error("Already initialized");
    this.loginModal.init();
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
          // if configuration is required for the adapter, return silently by logging a warning.
          if (defaultAdapterConfig.configurationRequired) {
            if (adapterName === WALLET_ADAPTERS.CUSTOM_AUTH && this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN]) {
              resolve(null);
              return;
            }
            if (adapterName === WALLET_ADAPTERS.OPENLOGIN && this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH]) {
              resolve(null);
              return;
            }

            const adapterAlternatives = this.aggregatorModalConfig.requiredAdapters[adapterName]?.alternatives;
            // if this adapter is required and no alternative is available thn throw.
            if (!adapterAlternatives || adapterAlternatives.length === 0) {
              throw WalletInitializationError.invalidParams(`${adapterName} adapter is required to be configured,
                  please use "configureWallet" function to configure it or set "showOnModal" to false
                   if you don't want to use in modal for this adapter in modal config`);
            }
            let alternativeAdapterPresent = false;
            if (adapterAlternatives) {
              adapterAlternatives.forEach((alternative) => {
                if (this.walletAdapters[alternative]) {
                  alternativeAdapterPresent = true;
                }
              });
            }
            if (!alternativeAdapterPresent) {
              throw WalletInitializationError.invalidParams(`Either one of ${[
                adapterName,
                ...adapterAlternatives,
              ]} adapters is required to be configured,
              please use "configureWallet" function to configure it or set "showOnModal" to false
              if you don't want to use in modal for this adapter in modal config`);
            }
            resolve(null);
            return;
          }
          // if adapter is not configured and some default configuration is available, use it.
          getDefaultAdapterModule(adapterName)
            .then(async (ad: IAdapter<unknown>) => {
              this.walletAdapters[adapterName] = ad;
              // if adapter doesn't have any chain config yet thn set it based on modal namespace and chainId.
              // this applies only to multichain adapters where chainNamespace cannot be determined from adapter.
              if (
                this.walletAdapters[adapterName].namespace === ADAPTER_NAMESPACES.MULTICHAIN &&
                !this.walletAdapters[adapterName].currentChainNamespace
              ) {
                const chainConfig = getChainConfig(this.options.chainNamespace, this.options.chainId);
                this.walletAdapters[adapterName].setChainConfig(chainConfig);
              }
              if (ad.type === ADAPTER_CATEGORY.IN_APP) {
                hasInAppWallets = true;
              }
              if (ad.type === ADAPTER_CATEGORY.IN_APP || adapterName === this.cachedAdapter) {
                this.subscribeToAdapterEvents(ad);

                await ad.init({ autoConnect: this.cachedAdapter === adapterName });
              }
              this.aggregatorModalConfig[adapterName] = adapterConfig;
              resolve(adapterName);
              return true;
            })
            .catch((err) => reject(err));
        } else if (adapter?.type === ADAPTER_CATEGORY.IN_APP || adapterName === this.cachedAdapter) {
          // if adapter is configured thn only initialize in app or cached adapter.
          // external wallets are initialized on INIT_EXTERNAL_WALLET event.
          if (adapter.type === ADAPTER_CATEGORY.IN_APP) {
            hasInAppWallets = true;
          }
          this.subscribeToAdapterEvents(adapter);
          if (
            this.walletAdapters[adapterName].namespace === ADAPTER_NAMESPACES.MULTICHAIN &&
            !this.walletAdapters[adapterName].currentChainNamespace
          ) {
            const chainConfig = getChainConfig(this.options.chainNamespace, this.options.chainId);
            this.walletAdapters[adapterName].setChainConfig(chainConfig);
          }
          adapter
            .init({ autoConnect: this.cachedAdapter === adapterName })
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
            log.info("error while intializing adapter", e);
            return e;
          })
        )
      );
      // if any in app wallet is present thn only initialize in app wallet or cached wallet in modal
      if (hasInAppWallets) {
        adapterInitResults.forEach((result) => {
          log.info("adapterInitResults", result, this.walletAdapters[result]);
          if (result && !(result instanceof Error)) {
            if (this.walletAdapters[result].type === ADAPTER_CATEGORY.IN_APP) {
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
    const adaptersData: Record<string, unknown> = {};

    log.info("this.walletAdapters) ", this.walletAdapters);
    Object.keys(this.walletAdapters).forEach(async (adapterName) => {
      const adapter = this.walletAdapters[adapterName];
      if (adapter?.type === ADAPTER_CATEGORY.EXTERNAL) {
        log.info("init external wallet", this.cachedAdapter, adapterName);
        const adPromise = new Promise((resolve, reject) => {
          this.subscribeToAdapterEvents(adapter);
          if (
            this.walletAdapters[adapterName].namespace === ADAPTER_NAMESPACES.MULTICHAIN &&
            !this.walletAdapters[adapterName].currentChainNamespace
          ) {
            adapter.setChainConfig(getChainConfig(this.options.chainNamespace, this.options.chainId));
          }
          adapter
            .init({ autoConnect: this.cachedAdapter === adapterName })
            .then(() => {
              adaptersConfig[adapterName] = this.aggregatorModalConfig.adapters[adapterName];
              adaptersData[adapterName] = adapter.adapterData || {};
              resolve(adapterName);
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
      this.loginModal.addWalletLogins(adaptersConfig, adaptersData, { ...options });
    }
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on(LOGIN_MODAL_EVENTS.LOGIN, async (params: { adapter: WALLET_ADAPTER_TYPE; loginParams: unknown }) => {
      await this.connectTo<unknown>(params.adapter, params.loginParams);
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalWalletAdapters(params.externalWalletsInitialized);
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.DISCONNECT, async () => {
      await this.logout();
    });
  }
}
