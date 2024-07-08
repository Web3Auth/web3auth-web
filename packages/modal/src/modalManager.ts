import {
  BaseConnectorConfig,
  CONNECTOR_CATEGORY,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  CustomChainConfig,
  fetchProjectConfig,
  getChainConfig,
  IBaseProvider,
  IConnector,
  IProvider,
  IWeb3AuthCoreOptions,
  log,
  LoginMethodConfig,
  PROJECT_CONFIG_RESPONSE,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
} from "@web3auth/base";
import { CommonJRPCProvider } from "@web3auth/base-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { getSocialConnectorDefaultOptions, LOGIN_PROVIDER, LoginConfig, OpenLoginOptions, SocialConnector } from "@web3auth/social-connector";
import { getConnectorSocialLogins, getUserLanguage, LOGIN_MODAL_EVENTS, LoginModal, SOCIAL_PROVIDERS, UIConfig } from "@web3auth/ui";
import { WalletConnectConnector } from "@web3auth/wallet-connect-connector";
import clonedeep from "lodash.clonedeep";
import merge from "lodash.merge";

import { defaultOtherModalConfig } from "./config";
import { ConnectorsModalConfig, IWeb3AuthModal, ModalConfig } from "./interface";

export interface Web3AuthOptions extends IWeb3AuthCoreOptions {
  /**
   * Config for configuring modal ui display properties
   */
  uiConfig?: Omit<UIConfig, "connectorListener">;

  /**
   * Private key provider for your chain namespace
   */
  privateKeyProvider: IBaseProvider<string>;
}

export class Web3Auth extends Web3AuthNoModal implements IWeb3AuthModal {
  public loginModal: LoginModal;

  readonly options: Web3AuthOptions;

  private modalConfig: ConnectorsModalConfig = defaultOtherModalConfig;

  constructor(options: Web3AuthOptions) {
    super(options);
    this.options = { ...options };

    if (!this.options.uiConfig) this.options.uiConfig = {};
    if (!this.coreOptions.privateKeyProvider) throw WalletInitializationError.invalidParams("privateKeyProvider is required");
  }

  public setModalConfig(modalConfig: ConnectorsModalConfig): void {
    super.checkInitRequirements();
    this.modalConfig = modalConfig;
  }

  public async initModal(params?: { modalConfig?: Record<WALLET_CONNECTOR_TYPE, ModalConfig> }): Promise<void> {
    super.checkInitRequirements();

    let projectConfig: PROJECT_CONFIG_RESPONSE;
    try {
      projectConfig = await fetchProjectConfig(this.options.clientId, this.options.web3AuthNetwork);
    } catch (e) {
      log.error("Failed to fetch project configurations", e);
      throw WalletInitializationError.notReady("failed to fetch project configurations");
    }

    const { whitelabel } = projectConfig;
    this.options.uiConfig = merge(clonedeep(whitelabel), this.options.uiConfig);
    if (!this.options.uiConfig.defaultLanguage) this.options.uiConfig.defaultLanguage = getUserLanguage(this.options.uiConfig.defaultLanguage);
    if (!this.options.uiConfig.mode) this.options.uiConfig.mode = "light";

    this.loginModal = new LoginModal({
      ...this.options.uiConfig,
      connectorListener: this,
    });
    this.subscribeToLoginModalEvents();

    const { sms_otp_enabled: smsOtpEnabled, whitelist } = projectConfig;
    if (smsOtpEnabled !== undefined) {
      const connectorConfig: Record<WALLET_CONNECTOR_TYPE, ModalConfig> = {
        [WALLET_CONNECTORS.SOCIAL]: {
          label: WALLET_CONNECTORS.SOCIAL,
          loginMethods: {
            [LOGIN_PROVIDER.SMS_PASSWORDLESS]: {
              name: LOGIN_PROVIDER.SMS_PASSWORDLESS,
              showOnModal: smsOtpEnabled,
              showOnDesktop: smsOtpEnabled,
              showOnMobile: smsOtpEnabled,
            },
          },
        },
      };
      if (!params?.modalConfig) params = { modalConfig: {} };
      params.modalConfig = merge(clonedeep(params.modalConfig), connectorConfig);
    }

    await this.loginModal.initModal();
    const providedChainConfig = this.options.chainConfig;
    // merge default connectors with the custom configured connectors.
    const allConnectors = [...new Set([...Object.keys(this.modalConfig.connectors || {}), ...Object.keys(this.walletConnectors)])];

    const connectorConfigurationPromises = allConnectors.map(async (connectorName) => {
      // start with the default config of connector.
      let connectorConfig = this.modalConfig.connectors?.[connectorName] || {
        label: connectorName,
        showOnModal: true,
        showOnMobile: true,
        showOnDesktop: true,
      };

      // override the default config of connector if some config is being provided by the user.
      if (params?.modalConfig?.[connectorName]) {
        connectorConfig = { ...connectorConfig, ...params.modalConfig[connectorName] };
      }
      (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName] = connectorConfig as ModalConfig;

      // check if connector is configured/added by user and exist in walletConnectors map.
      const connector = this.walletConnectors[connectorName];
      log.debug("connector config", connectorName, this.modalConfig.connectors?.[connectorName].showOnModal, connector);

      // if connector is not custom configured then check if it is available in default connectors.
      // and if connector is not hidden by user
      if (!connector && this.modalConfig.connectors?.[connectorName].showOnModal) {
        // Connectors to be shown on modal should be pre-configured.
        if (connectorName === WALLET_CONNECTORS.SOCIAL) {
          const defaultOptions = getSocialConnectorDefaultOptions();
          const { clientId, useCoreKitKey, chainConfig, web3AuthNetwork, sessionTime, privateKeyProvider } = this.coreOptions;
          const finalChainConfig = {
            ...getChainConfig(providedChainConfig.chainNamespace, this.coreOptions.chainConfig?.id),
            ...chainConfig,
          } as CustomChainConfig;
          if (!privateKeyProvider) {
            throw WalletInitializationError.invalidParams("privateKeyProvider is required");
          }
          const finalOpenloginConnectorSettings: Partial<OpenLoginOptions> = {
            ...defaultOptions.connectorSettings,
            clientId,
            network: web3AuthNetwork,
            whiteLabel: this.options.uiConfig,
          };
          if (smsOtpEnabled !== undefined) {
            finalOpenloginConnectorSettings.loginConfig = {
              [LOGIN_PROVIDER.SMS_PASSWORDLESS]: {
                showOnModal: smsOtpEnabled,
                showOnDesktop: smsOtpEnabled,
                showOnMobile: smsOtpEnabled,
                showOnSocialBackupFactor: smsOtpEnabled,
              } as LoginConfig[keyof LoginConfig],
            };
          }
          if (whitelist) {
            finalOpenloginConnectorSettings.originData = whitelist.signed_urls;
          }
          if (this.options.uiConfig.uxMode) {
            finalOpenloginConnectorSettings.uxMode = this.options.uiConfig.uxMode;
          }
          const openloginConnector = new SocialConnector({
            ...defaultOptions,
            clientId,
            useCoreKitKey,
            chainConfig: { ...finalChainConfig },
            connectorSettings: finalOpenloginConnectorSettings,
            sessionTime,
            web3AuthNetwork,
            privateKeyProvider,
          });
          this.walletConnectors[connectorName] = openloginConnector;
          return connectorName;
        }
        throw WalletInitializationError.invalidParams(`Connector ${connectorName} is not configured`);
      } else if (
        connector?.type === CONNECTOR_CATEGORY.IN_APP ||
        connector?.type === CONNECTOR_CATEGORY.EXTERNAL ||
        connectorName === this.cachedConnector
      ) {
        if (!this.modalConfig.connectors?.[connectorName].showOnModal) return;
        // add client id to connector, same web3auth client id can be used in connector.
        // this id is being overridden if user is also passing client id in connector's constructor.
        this.walletConnectors[connectorName].setConnectorSettings({
          clientId: this.options.clientId,
          sessionTime: this.options.sessionTime,
          web3AuthNetwork: this.options.web3AuthNetwork,
          useCoreKitKey: this.coreOptions.useCoreKitKey,
        });

        // if connector doesn't have any chainConfig then we will set the chainConfig based of passed chainNamespace
        // and chainNamespace.
        if (!connector.chainConfigProxy) {
          const chainConfig = {
            ...getChainConfig(providedChainConfig.chainNamespace, this.coreOptions.chainConfig?.id),
            ...this.coreOptions.chainConfig,
          } as CustomChainConfig;
          this.walletConnectors[connectorName].setConnectorSettings({ chainConfig });
        }

        if (connectorName === WALLET_CONNECTORS.SOCIAL) {
          const socialConnector = this.walletConnectors[connectorName] as SocialConnector;
          if (this.coreOptions.privateKeyProvider) {
            if (socialConnector.currentChainNamespace !== this.coreOptions.privateKeyProvider.currentChainConfig.chainNamespace) {
              throw WalletInitializationError.incompatibleChainNameSpace(
                "private key provider is not compatible with provided chainNamespace for openlogin connector"
              );
            }
            socialConnector.setConnectorSettings({ privateKeyProvider: this.coreOptions.privateKeyProvider });
          }
          if (smsOtpEnabled !== undefined) {
            socialConnector.setConnectorSettings({
              loginConfig: {
                [LOGIN_PROVIDER.SMS_PASSWORDLESS]: {
                  showOnModal: smsOtpEnabled,
                  showOnDesktop: smsOtpEnabled,
                  showOnMobile: smsOtpEnabled,
                  showOnSocialBackupFactor: smsOtpEnabled,
                } as LoginConfig[keyof LoginConfig],
              },
            });
          }
          if (whitelist) {
            socialConnector.setConnectorSettings({ originData: whitelist.signed_urls });
          }
          if (this.options.uiConfig?.uxMode) {
            socialConnector.setConnectorSettings({ uxMode: this.options.uiConfig.uxMode });
          }
          socialConnector.setConnectorSettings({ whiteLabel: this.options.uiConfig });
          if (!socialConnector.privateKeyProvider) {
            throw WalletInitializationError.invalidParams("privateKeyProvider is required for openlogin connector");
          }
        } else if (connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) {
          const walletConnectConnector = this.walletConnectors[connectorName] as WalletConnectConnector;
          const { wallet_connect_enabled: walletConnectEnabled, wallet_connect_project_id: walletConnectProjectId } = projectConfig;

          if (walletConnectEnabled === false) {
            // override user specified config by hiding wallet connect
            this.modalConfig.connectors = {
              ...(this.modalConfig.connectors ?? {}),
              [WALLET_CONNECTORS.WALLET_CONNECT_V2]: {
                ...(this.modalConfig.connectors?.[WALLET_CONNECTORS.WALLET_CONNECT_V2] ?? {}),
                showOnModal: false,
              },
            } as Record<string, ModalConfig>;
            this.modalConfig.connectors[WALLET_CONNECTORS.WALLET_CONNECT_V2].showOnModal = false;
          } else {
            if (!walletConnectConnector?.connectorOptions?.connectorSettings?.walletConnectInitOptions?.projectId && !walletConnectProjectId)
              throw WalletInitializationError.invalidParams("Invalid wallet connect project id. Please configure it on the dashboard");

            if (walletConnectProjectId) {
              walletConnectConnector.setConnectorSettings({
                connectorSettings: {
                  walletConnectInitOptions: {
                    projectId: walletConnectProjectId,
                  },
                },
              });
            }
          }
        }

        return connectorName;
      }
    });

    const connectorNames = await Promise.all(connectorConfigurationPromises);
    const hasInAppWallets = Object.values(this.walletConnectors).some((connector: IConnector<unknown>) => {
      if (connector.type !== CONNECTOR_CATEGORY.IN_APP) return false;
      if (this.modalConfig.connectors?.[connector.name]?.showOnModal !== true) return false;
      if (!this.modalConfig.connectors?.[connector.name]?.loginMethods) return true;
      const mergedLoginMethods = getConnectorSocialLogins(
        connector.name,
        (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connector.name]?.loginMethods
      );
      if (Object.values(mergedLoginMethods).some((method: LoginMethodConfig[keyof LoginMethodConfig]) => method.showOnModal)) return true;
      return false;
    });
    log.debug(hasInAppWallets, this.walletConnectors, connectorNames, "hasInAppWallets");

    // Now, initialize the connectors.
    const initPromises = connectorNames.map(async (connectorName: string) => {
      if (!connectorName) return;
      try {
        const connector = this.walletConnectors[connectorName];
        // only initialize a external connector here if it is a cached connector.
        if (this.cachedConnector !== connectorName && connector.type === CONNECTOR_CATEGORY.EXTERNAL) {
          return;
        }
        // in-app wallets or cached wallet (being connected or already connected) are initialized first.
        // if connector is configured then only initialize in app or cached connector.
        // external wallets are initialized on INIT_EXTERNAL_WALLET event.
        this.subscribeToConnectorEvents(connector);
        if (connector.status === CONNECTOR_STATUS.NOT_READY) await connector.init({ autoConnect: this.cachedConnector === connectorName });
        // note: not adding cachedWallet to modal if it is external wallet.
        // adding it later if no in-app wallets are available.
        if (connector.type === CONNECTOR_CATEGORY.IN_APP) {
          this.initializeInAppWallet(connectorName);
        }
      } catch (error) {
        log.error(error, "error while initializing connector");
      }
    });

    this.commonJRPCProvider = await CommonJRPCProvider.getProviderInstance({ chainConfig: this.coreOptions.chainConfig as CustomChainConfig });
    await Promise.all(initPromises);
    if (this.status === CONNECTOR_STATUS.NOT_READY) {
      this.status = CONNECTOR_STATUS.READY;
      this.emit(CONNECTOR_EVENTS.READY);
    }

    const hasExternalWallets = allConnectors.some((connectorName: string) => {
      return this.walletConnectors[connectorName]?.type === CONNECTOR_CATEGORY.EXTERNAL && this.modalConfig.connectors?.[connectorName].showOnModal;
    });

    if (hasExternalWallets) {
      this.loginModal.initExternalWalletContainer();
    }

    // variable to check if we have any in app wallets
    // currently all default in app and external wallets can be hidden or shown based on config.
    if (!hasInAppWallets && hasExternalWallets) {
      // if no in app wallet is available then initialize external wallets in modal
      await this.initExternalwalletConnectors(false, { showExternalWalletsOnly: true });
    }
  }

  public async connect(): Promise<IProvider | null> {
    if (!this.loginModal) throw new Error("Login modal is not initialized");
    // if already connected return provider
    if (this.connectedConnectorName && this.status === CONNECTOR_STATUS.CONNECTED && this.provider) return this.provider;
    this.loginModal.open();
    return new Promise((resolve, reject) => {
      this.once(CONNECTOR_EVENTS.CONNECTED, () => {
        return resolve(this.provider);
      });
      this.once(CONNECTOR_EVENTS.ERRORED, (err: unknown) => {
        return reject(err);
      });
      this.once(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (visibility: boolean) => {
        // modal is closed but user is not connected to any wallet.
        if (!visibility && this.status !== CONNECTOR_STATUS.CONNECTED) {
          return reject(new Error("User closed the modal"));
        }
      });
    });
  }

  private async initExternalwalletConnectors(externalWalletsInitialized: boolean, options?: { showExternalWalletsOnly: boolean }): Promise<void> {
    if (externalWalletsInitialized) return;
    const connectorsConfig: Record<string, BaseConnectorConfig> = {};
    Object.keys(this.walletConnectors).forEach(async (connectorName) => {
      const connector = this.walletConnectors[connectorName];
      if (connector?.type === CONNECTOR_CATEGORY.EXTERNAL) {
        log.debug("init external wallet", this.cachedConnector, connectorName);
        this.subscribeToConnectorEvents(connector);
        // we are not initializing cached connector here as it is already being initialized in initModal before.
        if (this.cachedConnector === connectorName) {
          return;
        }
        if (connector.status === CONNECTOR_STATUS.NOT_READY) {
          await connector
            .init({ autoConnect: this.cachedConnector === connectorName })
            .then(() => {
              connectorsConfig[connectorName] = (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName];
              this.loginModal.addWalletLogins(connectorsConfig, { showExternalWalletsOnly: !!options?.showExternalWalletsOnly });
              return undefined;
            })
            .catch((error) => log.error(error, "error while initializing connector"));
        } else if (connector.status === CONNECTOR_STATUS.READY) {
          connectorsConfig[connectorName] = (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName];
          this.loginModal.addWalletLogins(connectorsConfig, { showExternalWalletsOnly: !!options?.showExternalWalletsOnly });
        }
      }
    });
  }

  private initializeInAppWallet(connectorName: string): void {
    log.info("connectorInitResults", connectorName);
    if (this.walletConnectors[connectorName].type === CONNECTOR_CATEGORY.IN_APP) {
      this.loginModal.addSocialLogins(
        connectorName,
        getConnectorSocialLogins(
          connectorName,
          (this.modalConfig.connectors as Record<WALLET_CONNECTOR_TYPE, ModalConfig>)[connectorName]?.loginMethods
        ),
        this.options.uiConfig?.loginMethodsOrder || SOCIAL_PROVIDERS,
        {
          ...this.options.uiConfig,
          loginGridCol: this.options.uiConfig?.loginGridCol || 3,
          primaryButton: this.options.uiConfig?.primaryButton || "socialLogin",
        }
      );
    }
  }

  private subscribeToLoginModalEvents(): void {
    this.loginModal.on(LOGIN_MODAL_EVENTS.LOGIN, async (params: { connector: WALLET_CONNECTOR_TYPE; loginParams: unknown }) => {
      try {
        await this.connectTo<unknown>(params.connector, params.loginParams);
      } catch (error) {
        log.error(`Error while connecting to connector: ${params.connector}`, error);
      }
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, async (params: { externalWalletsInitialized: boolean }) => {
      await this.initExternalwalletConnectors(params.externalWalletsInitialized);
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.DISCONNECT, async () => {
      try {
        await this.logout();
      } catch (error) {
        log.error(`Error while disconnecting`, error);
      }
    });
    this.loginModal.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, async (visibility: boolean) => {
      log.debug("is login modal visible", visibility);
      this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, visibility);
      const connector = this.walletConnectors[WALLET_CONNECTORS.WALLET_CONNECT_V2];
      if (connector) {
        const walletConnectStatus = connector?.status;
        log.debug("trying refreshing wc session", visibility, walletConnectStatus);
        if (visibility && (walletConnectStatus === CONNECTOR_STATUS.READY || walletConnectStatus === CONNECTOR_STATUS.CONNECTING)) {
          log.debug("refreshing wc session");

          // refreshing session for wallet connect whenever modal is opened.
          try {
            connector.connect();
          } catch (error) {
            log.error(`Error while disconnecting to wallet connect in core`, error);
          }
        }
        if (
          !visibility &&
          this.status === CONNECTOR_STATUS.CONNECTED &&
          (walletConnectStatus === CONNECTOR_STATUS.READY || walletConnectStatus === CONNECTOR_STATUS.CONNECTING)
        ) {
          log.debug("this stops wc connector from trying to reconnect once proposal expires");
          connector.status = CONNECTOR_STATUS.READY;
        }
      }
    });
  }
}
