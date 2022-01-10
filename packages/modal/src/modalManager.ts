import { getDefaultAdapterModule } from "@web3auth/adapter-factory";
import {
  ADAPTER_CATEGORY,
  ADAPTER_STATUS,
  BaseAdapterConfig,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { Web3AuthCore, Web3AuthCoreOptions } from "@web3auth/core";
import LoginModal, { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import log from "loglevel";

import { defaultEvmDappModalConfig, defaultEvmWalletModalConfig, defaultSolanaDappModalConfig, defaultSolanaWalletModalConfig } from "./config";
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

  /**
   * Logo for your dapp, by default it will be the web3auth logo.
   */
  dappLogo?: string;
}
export class Web3Auth extends Web3AuthCore {
  public loginModal: LoginModal;

  readonly options: Web3AuthOptions;

  private defaultModalConfig: AdaptersModalConfig = defaultEvmDappModalConfig;

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };
    if (this.options.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      if (options.authMode === "WALLET") {
        // default config for solana wallet modal
        this.defaultModalConfig = defaultSolanaWalletModalConfig;
      } else {
        // default config for solana dapp modal
        this.defaultModalConfig = defaultSolanaDappModalConfig;
      }
    } else if (this.options.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      if (options.authMode === "WALLET") {
        // default config for evm wallet modal
        this.defaultModalConfig = defaultEvmWalletModalConfig;
      } else {
        // default config for evm dapp modal
        this.defaultModalConfig = defaultEvmDappModalConfig;
      }
    } else {
      throw new Error(`Invalid chainNamespace provided: ${this.options.chainNamespace}`);
    }
    this.loginModal = new LoginModal({ appLogo: this.options.dappLogo || "", version: "", adapterListener: this });
    this.subscribeToLoginModalEvents();
  }

  public async initModal(params?: { modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void> {
    super.checkInitRequirements();
    this.loginModal.init();
    const adapterPromises: Promise<string | Error | null>[] = [];
    // variable to check if we have any in app wallets
    // currently all default in app and external wallets can be hidden or shown based on config.
    let hasInAppWallets = false;

    // merge default adapters with the custom configured adapters.
    const allAdapters = new Set([...Object.keys(this.defaultModalConfig.adapters || {}), ...Object.keys(this.walletAdapters)]);

    allAdapters.forEach(async (adapterName) => {
      const adPromise: Promise<string | Error | null> = new Promise((resolve, reject) => {
        // start with the default config of adapter.
        let adapterConfig = this.defaultModalConfig.adapters?.[adapterName] || {
          label: adapterName,
          showOnModal: true,
          showOnMobile: true,
          showOnDesktop: true,
        };

        // override the default config of adapter if some config is being provided by the user.
        if (params?.modalConfig?.[adapterName]) {
          adapterConfig = { ...adapterConfig, ...params.modalConfig[adapterName] };
        }

        // check if adapter is configured/added by user and exist in walletAdapters map.
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
            chainId: this.options.chainConfig?.chainId,
            clientId: this.options.clientId,
          })
            .then(async (ad: IAdapter<unknown>) => {
              this.walletAdapters[adapterName] = ad;
              if (ad.type === ADAPTER_CATEGORY.IN_APP) {
                hasInAppWallets = true;
              }
              // in-app wallets or cached wallet (being connected or already connected) are initialized first.
              if (ad.type === ADAPTER_CATEGORY.IN_APP || adapterName === this.cachedAdapter) {
                this.subscribeToAdapterEvents(ad);

                await ad.init({ autoConnect: this.cachedAdapter === adapterName });
                if (ad.type === ADAPTER_CATEGORY.IN_APP) {
                  this.initializeInAppWallet(adapterName);
                }
              }
              (this.defaultModalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName] = adapterConfig as ModalConfig;
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

          // if adapter doesn't have any chainConfig then we will set the chainConfig based of passed chainNamespace
          // and chainNamespace.
          if (!adapter.chainConfigProxy) {
            const chainConfig = {
              ...getChainConfig(this.coreOptions.chainNamespace, this.coreOptions.chainConfig?.chainId),
              ...this.coreOptions.chainConfig,
            } as CustomChainConfig;
            this.walletAdapters[adapterName].setChainConfig(chainConfig);
          }
          // add client id to openlogin adapter, same web3auth client id can be used in openlogin.
          // this id is being overrided if user is also passing client id in openlogin's adapter constructor.
          if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
            this.walletAdapters[adapterName].setAdapterSettings({ clientId: this.options.clientId });
          }
          adapter
            .init({ autoConnect: this.cachedAdapter === adapterName })
            .then(() => {
              (this.defaultModalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName] = adapterConfig as ModalConfig;
              // note: not adding cachedWallet to modal if it is external wallet.
              // adding it later if no in-app wallets are available.
              if (adapter.type === ADAPTER_CATEGORY.IN_APP) {
                this.initializeInAppWallet(adapterName);
              }
              resolve(adapterName);
              return true;
            })
            .catch((err) => reject(err));
        } else {
          // for external wallets, no need to init here
          (this.defaultModalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName] = adapterConfig as ModalConfig;
          resolve(adapterName);
        }
      });
      adapterPromises.push(adPromise);
    });

    this.status = ADAPTER_STATUS.READY;

    if (adapterPromises.length > 0) {
      await Promise.all(
        adapterPromises.map((p) =>
          p.catch((e: Error) => {
            log.info("error while intializing adapter", e);
            return e;
          })
        )
      );
      if (!hasInAppWallets) {
        // if no in app wallet is available then initialize external wallets in modal
        await this.initExternalWalletAdapters(false, { showExternalWallets: true });
      }
    }
  }

  public connect() {
    if (!this.loginModal.initialized) throw new Error("Login modal is not initialized");
    this.loginModal.toggleModal();
  }

  private async initExternalWalletAdapters(externalWalletsInitialized: boolean, options?: { showExternalWallets: boolean }): Promise<void> {
    if (externalWalletsInitialized) return;
    const adapterPromises: Promise<string | Error>[] = [];
    const adaptersConfig: Record<string, BaseAdapterConfig> = {};
    const adaptersData: Record<string, unknown> = {};
    Object.keys(this.walletAdapters).forEach(async (adapterName) => {
      const adapter = this.walletAdapters[adapterName];
      if (adapter?.type === ADAPTER_CATEGORY.EXTERNAL) {
        log.debug("init external wallet", this.cachedAdapter, adapterName);
        const adPromise: Promise<string | Error> = new Promise((resolve, reject) => {
          this.subscribeToAdapterEvents(adapter);

          if (!adapter.chainConfigProxy) {
            const chainConfig = {
              ...getChainConfig(this.coreOptions.chainNamespace, this.coreOptions.chainConfig?.chainId),
              ...this.coreOptions.chainConfig,
            } as CustomChainConfig;
            adapter.setChainConfig(chainConfig);
          }
          adapter
            .init({ autoConnect: this.cachedAdapter === adapterName })
            .then(() => {
              adaptersConfig[adapterName] = (this.defaultModalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName];
              adaptersData[adapterName] = adapter.adapterData || {};
              resolve(adapterName);
              return true;
            })
            .catch((err) => {
              log.error("error while initialization external wallets", err);
              reject(err);
            });
        });
        adapterPromises.push(adPromise);
      }
    });

    if (adapterPromises.length > 0) {
      const adapterInitResults: (string | Error)[] = await Promise.all(adapterPromises.map((p) => p.catch((e: Error) => e)));
      const finalAdaptersConfig: Record<WALLET_ADAPTER_TYPE, ModalConfig> = {};
      adapterInitResults.forEach((result: string | Error) => {
        if (!(result instanceof Error)) {
          finalAdaptersConfig[result] = adaptersConfig[result];
        }
      });
      this.loginModal.addWalletLogins(adaptersConfig, adaptersData, { showExternalWallets: !!options?.showExternalWallets });
    }
  }

  private initializeInAppWallet(adapterName: string): void {
    log.info("adapterInitResults", adapterName);
    if (this.walletAdapters[adapterName].type === ADAPTER_CATEGORY.IN_APP) {
      this.loginModal.addSocialLogins(
        adapterName,
        (this.defaultModalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName],
        getAdapterSocialLogins(
          adapterName,
          this.walletAdapters[adapterName],
          (this.defaultModalConfig.adapters as Record<WALLET_ADAPTER_TYPE, ModalConfig>)[adapterName]?.loginMethods
        )
      );
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
