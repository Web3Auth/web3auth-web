import { ADAPTER_CATEGORY, ADAPTER_NAMESPACES, BaseAdapterConfig, CHAIN_NAMESPACES, getChainConfig, IAdapter, WALLET_ADAPTERS } from "@web3auth/base";
import { getDefaultAdapterModule, Web3AuthCore, Web3AuthCoreOptions } from "@web3auth/core";
import LoginModal, { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import log from "loglevel";

import { defaultEvmDappModalConfig, defaultEvmWalletModalConfig, defaultSolanaDappModalConfig, defaultSolanaWalletModalConfig } from "./config";
import { WALLET_ADAPTER_TYPE } from "./constants";
import { AdaptersModalConfig, ModalConfig } from "./interface";
import { getAdapterSocialLogins } from "./utils";

export interface Web3AuthOptions extends Web3AuthCoreOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;

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

  readonly options: Web3AuthOptions;

  private defaultModalConfig: AdaptersModalConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    adapters: {},
  };

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };
    // const defaultConfig = {};
    if (this.options.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (options.authMode === "WALLET") {
        this.defaultModalConfig = defaultSolanaWalletModalConfig;
      } else {
        this.defaultModalConfig = defaultSolanaDappModalConfig;
      }
    } else if (this.options.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      if (options.authMode === "WALLET") {
        this.defaultModalConfig = defaultEvmWalletModalConfig;
      } else {
        this.defaultModalConfig = defaultEvmDappModalConfig;
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
    const allAdapters = new Set([...Object.keys(this.defaultModalConfig.adapters), ...Object.keys(this.walletAdapters)]);
    // custom configured adapters
    allAdapters.forEach(async (adapterName) => {
      const adPromise = new Promise((resolve, reject) => {
        let adapterConfig = this.defaultModalConfig.adapters?.[adapterName] || {};
        if (params.modalConfig?.[adapterName]) {
          adapterConfig = { ...adapterConfig, ...params.modalConfig[adapterName] };
        }
        const adapter = this.walletAdapters[adapterName];
        // if adapter is not custom configured thn check if it is available in default adapters.
        if (!adapter) {
          // if custom auth is configured then no need to use default openlogin
          if (this.walletAdapters[WALLET_ADAPTERS.CUSTOM_AUTH] && adapterName === WALLET_ADAPTERS.OPENLOGIN) {
            resolve(null);
            return;
          }
          // if adapter is not configured and some default configuration is available, use it.
          getDefaultAdapterModule({
            name: adapterName,
            chainNamespace: this.options.chainNamespace,
            chainId: this.options.chainId,
            clientId: this.options.clientId,
          })
            .then(async (ad: IAdapter<unknown>) => {
              this.walletAdapters[adapterName] = ad;
              if (ad.type === ADAPTER_CATEGORY.IN_APP) {
                hasInAppWallets = true;
              }
              if (ad.type === ADAPTER_CATEGORY.IN_APP || adapterName === this.cachedAdapter) {
                this.subscribeToAdapterEvents(ad);

                await ad.init({ autoConnect: this.cachedAdapter === adapterName });
              }
              this.defaultModalConfig[adapterName] = adapterConfig;
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
          // add client id to openlogin adapter
          if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
            this.walletAdapters[adapterName].setAdapterSettings({ clientId: this.options.clientId });
          }
          adapter
            .init({ autoConnect: this.cachedAdapter === adapterName })
            .then(() => {
              this.defaultModalConfig[adapterName] = adapterConfig;
              resolve(adapterName);
              return true;
            })
            .catch((err) => reject(err));
        } else {
          // for external wallets, no need to init here
          this.defaultModalConfig[adapterName] = adapterConfig;
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
                this.defaultModalConfig[result],
                getAdapterSocialLogins(result, this.walletAdapters[result], this.defaultModalConfig[result]?.loginMethods)
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
              adaptersConfig[adapterName] = this.defaultModalConfig.adapters[adapterName];
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
