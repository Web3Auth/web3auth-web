"use client";

import "./css/index.css";

import { applyWhiteLabelTheme, LANGUAGES, SafeEventEmitter, THEME_MODES } from "@web3auth/auth";
import {
  type Analytics,
  ANALYTICS_EVENTS,
  type BaseConnectorConfig,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  getWhitelabelAnalyticsProperties,
  type IConnectorDataEvent,
  log,
  LOGIN_MODE,
  type LoginMethodConfig,
  LoginModeType,
  type MetaMaskConnectorData,
  type SDK_CONNECTED_EVENT_DATA,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  type WalletConnectV2Data,
  WalletInitializationError,
  type Web3AuthError,
  type Web3AuthNoModalEvents,
  WIDGET_TYPE,
} from "@web3auth/no-modal";
import Bowser from "bowser";
import { createRoot } from "react-dom/client";

import { getLoginModalAnalyticsProperties } from "../utils";
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT, DEFAULT_ON_PRIMARY_COLOR, DEFAULT_PRIMARY_COLOR, PAGES } from "./constants";
import Widget from "./containers/Widget";
import { AnalyticsContext } from "./context/AnalyticsContext";
import { WidgetProvider } from "./context/WidgetContext";
import {
  browser,
  ExternalWalletEventType,
  LoginModalCallbacks,
  LoginModalProps,
  MODAL_STATUS,
  ModalState,
  os,
  platform,
  SocialLoginEventType,
  StateEmitterEvents,
  UIConfig,
} from "./interfaces";
import i18n from "./localeImport";
import { getUserLanguage } from "./utils";

function createWrapperForModal(parentZIndex: string) {
  const existingWrapper = document.getElementById("w3a-parent-container");
  if (existingWrapper) existingWrapper.remove();
  const parent = document.createElement("section");
  parent.classList.add("w3a-parent-container");
  parent.setAttribute("id", "w3a-parent-container");
  parent.style.zIndex = parentZIndex;
  parent.style.position = "relative";
  document.body.appendChild(parent);
}

function createWrapperForEmbed(targetId: string) {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) {
    log.error(`Element with ID ${targetId} not found`);
    return;
  }
  targetElement.innerHTML = `<div id="w3a-parent-container" class="w3a-parent-container"></div>`;
}

export class LoginModal {
  private uiConfig: LoginModalProps;

  private stateEmitter: SafeEventEmitter<StateEmitterEvents>;

  private callbacks: LoginModalCallbacks;

  private externalWalletsConfig: Record<string, BaseConnectorConfig>;

  private analytics: Analytics;

  constructor(uiConfig: LoginModalProps, callbacks: LoginModalCallbacks) {
    this.uiConfig = uiConfig;

    if (!uiConfig.logoDark) this.uiConfig.logoDark = DEFAULT_LOGO_DARK;
    if (!uiConfig.logoLight) this.uiConfig.logoLight = DEFAULT_LOGO_LIGHT;
    if (!uiConfig.mode) this.uiConfig.mode = THEME_MODES.light;
    if (!uiConfig.modalZIndex) this.uiConfig.modalZIndex = "99998";
    if (typeof uiConfig.displayErrorsOnModal === "undefined") this.uiConfig.displayErrorsOnModal = true;
    if (!uiConfig.appName) this.uiConfig.appName = "Web3Auth";
    if (!uiConfig.loginGridCol) this.uiConfig.loginGridCol = 3;
    if (!uiConfig.primaryButton) this.uiConfig.primaryButton = "socialLogin";
    if (!uiConfig.defaultLanguage) this.uiConfig.defaultLanguage = getUserLanguage(uiConfig.defaultLanguage);
    if (!uiConfig.widgetType) this.uiConfig.widgetType = WIDGET_TYPE.MODAL;
    if (!uiConfig.initialAuthenticationMode) this.uiConfig.initialAuthenticationMode = CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_ONLY;
    if (!uiConfig.buttonRadiusType) this.uiConfig.buttonRadiusType = "pill";
    if (!uiConfig.logoAlignment) this.uiConfig.logoAlignment = "center";
    if (typeof uiConfig.displayInstalledExternalWallets === "undefined") this.uiConfig.displayInstalledExternalWallets = true;
    if (typeof uiConfig.displayExternalWalletsCount === "undefined") this.uiConfig.displayExternalWalletsCount = true;
    if (typeof uiConfig.hideSuccessScreen === "undefined") this.uiConfig.hideSuccessScreen = false;
    if (!uiConfig.privacyPolicy) this.uiConfig.privacyPolicy = "";
    if (!uiConfig.tncLink) this.uiConfig.tncLink = "";

    if (uiConfig.widgetType === WIDGET_TYPE.EMBED && !uiConfig.targetId) {
      log.error("targetId is required for embed widget");
      throw WalletInitializationError.invalidParams("targetId is required for embed widget");
    }

    this.stateEmitter = new SafeEventEmitter<StateEmitterEvents>();
    this.callbacks = callbacks;
    this.analytics = uiConfig.analytics;
    this.subscribeCoreEvents(this.uiConfig.connectorListener);
  }

  get isDark(): boolean {
    return this.uiConfig.mode === "dark" || (this.uiConfig.mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  get deviceDetails() {
    if (typeof window === "undefined") return { platform: "mobile" as platform, browser: "chrome" as browser, os: "ios" as os };
    const browserData = Bowser.getParser(window.navigator.userAgent);
    return {
      platform: browserData.getPlatformType() as platform,
      browser: browserData.getBrowserName().toLowerCase() as browser,
      os: browserData.getOSName() as os,
    };
  }

  initModal = async (): Promise<void> => {
    const useLang = this.uiConfig.defaultLanguage || LANGUAGES.en;

    // Load new language resource

    if (useLang === LANGUAGES.de) {
      import("./i18n/german.json")
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.ja) {
      import(`./i18n/japanese.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.ko) {
      import(`./i18n/korean.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.zh) {
      import(`./i18n/mandarin.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.es) {
      import(`./i18n/spanish.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.fr) {
      import(`./i18n/french.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.pt) {
      import(`./i18n/portuguese.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.nl) {
      import(`./i18n/dutch.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.tr) {
      import(`./i18n/turkish.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    } else if (useLang === LANGUAGES.en) {
      import(`./i18n/english.json`)
        .then((messages) => {
          i18n.addResourceBundle(useLang as string, "translation", messages.default);
          return i18n.changeLanguage(useLang);
        })
        .catch((error) => {
          log.error(error);
        });
    }

    return new Promise((resolve) => {
      this.stateEmitter.once("MOUNTED", () => {
        log.info("rendered");
        this.setState({
          status: MODAL_STATUS.INITIALIZED,
        });
        return resolve();
      });

      if (this.uiConfig.widgetType === WIDGET_TYPE.MODAL) {
        createWrapperForModal(this.uiConfig.modalZIndex);
      } else if (this.uiConfig.widgetType === WIDGET_TYPE.EMBED) {
        createWrapperForEmbed(this.uiConfig.targetId);
      } else {
        throw WalletInitializationError.invalidParams(`Invalid widget type: ${this.uiConfig.widgetType}`);
      }

      const container = document.getElementById("w3a-parent-container");

      if (this.isDark) {
        container.classList.add("w3a--dark");
      } else {
        container.classList.remove("w3a--dark");
      }

      const root = createRoot(container);
      root.render(
        <AnalyticsContext.Provider value={{ analytics: this.analytics }}>
          <WidgetProvider
            isDark={this.isDark}
            deviceDetails={this.deviceDetails}
            uiConfig={this.uiConfig}
            handleShowExternalWallets={this.handleShowExternalWallets}
            handleExternalWalletClick={this.handleExternalWalletClick}
            handleMobileVerifyConnect={this.handleMobileVerifyConnect}
            handleSocialLoginClick={this.handleSocialLoginClick}
            closeModal={this.closeModal}
          >
            <Widget stateListener={this.stateEmitter} />
          </WidgetProvider>
        </AnalyticsContext.Provider>
      );

      const isDefaultColors = this.uiConfig?.theme?.primary === DEFAULT_PRIMARY_COLOR && this.uiConfig.theme?.onPrimary === DEFAULT_ON_PRIMARY_COLOR;

      if (this.uiConfig?.theme && !isDefaultColors) {
        import("color")
          .then(({ default: Color }) => {
            const rootElement = document.getElementById("w3a-parent-container") as HTMLElement;
            applyWhiteLabelTheme(Color, rootElement, this.uiConfig.theme);
            return;
          })
          .catch((error) => {
            log.error(error);
          });
      }
    });
  };

  addSocialLogins = (loginMethods: LoginMethodConfig, loginMethodsOrder: string[], uiConfig: Omit<UIConfig, "connectorListener">): void => {
    this.setState({
      socialLoginsConfig: {
        loginMethods,
        loginMethodsOrder,
        uiConfig,
      },
    });
    log.info("addSocialLogins", loginMethods, loginMethodsOrder, uiConfig);
  };

  addWalletLogins = (
    externalWalletsConfig: Record<string, BaseConnectorConfig>,
    options?: { externalWalletsInitialized: boolean; externalWalletsVisibility: boolean; showExternalWalletsOnly: boolean }
  ): void => {
    this.externalWalletsConfig = externalWalletsConfig;
    const isMMAvailable = !!externalWalletsConfig[WALLET_CONNECTORS.METAMASK];
    this.setState({
      externalWalletsConfig,
      externalWalletsInitialized: !!options.externalWalletsInitialized,
      showExternalWalletsOnly: !!options.showExternalWalletsOnly,
      externalWalletsVisibility: isMMAvailable ? false : !!options.externalWalletsVisibility,
    });
  };

  open = () => {
    this.setState({
      modalVisibility: true,
    });
    this.analytics?.track(ANALYTICS_EVENTS.LOGIN_MODAL_OPENED, {
      chain_namespaces: this.uiConfig.chainNamespaces,
      wallet_registry_count: Object.keys(this.uiConfig.walletRegistry?.default).length + Object.keys(this.uiConfig.walletRegistry?.others).length,
      external_wallet_connectors: Object.keys(this.externalWalletsConfig || {}),
      ...getWhitelabelAnalyticsProperties(this.uiConfig),
      ...getLoginModalAnalyticsProperties(this.uiConfig),
    });
    if (this.callbacks.onModalVisibility) {
      this.callbacks.onModalVisibility(true);
    }
  };

  closeModal = () => {
    this.setState({
      modalVisibility: false,
      externalWalletsVisibility: false,
    });
    this.analytics?.track(ANALYTICS_EVENTS.LOGIN_MODAL_CLOSED);
    if (this.callbacks.onModalVisibility) {
      this.callbacks.onModalVisibility(false);
    }
  };

  initExternalWalletContainer = () => {
    this.setState({
      hasExternalWallets: true,
    });
  };

  private handleShowExternalWallets = (status: boolean) => {
    if (this.callbacks.onInitExternalWallets) {
      this.callbacks.onInitExternalWallets({ externalWalletsInitialized: status });
    }
  };

  private handleExternalWalletClick = (params: ExternalWalletEventType) => {
    log.info("external wallet clicked", params);
    const { connector, chainNamespace } = params;
    if (this.callbacks.onExternalWalletLogin) {
      this.callbacks.onExternalWalletLogin({ connector, loginParams: { chainNamespace } });
    }
  };

  private handleMobileVerifyConnect = (params: { connector: WALLET_CONNECTOR_TYPE }) => {
    log.info("mobile verify connect clicked", params);
    const { connector } = params;
    if (this.callbacks.onMobileVerifyConnect) {
      this.callbacks.onMobileVerifyConnect({ connector });
    }
  };

  private handleSocialLoginClick = (params: SocialLoginEventType) => {
    log.info("social login clicked", params);
    const { loginParams } = params;
    this.analytics?.track(ANALYTICS_EVENTS.SOCIAL_LOGIN_SELECTED, {
      connector: WALLET_CONNECTORS.AUTH,
      auth_connection: loginParams.authConnection,
      auth_connection_id: loginParams.authConnectionId,
      group_auth_connection_id: loginParams.groupedAuthConnectionId,
    });
    if (this.callbacks.onSocialLogin) {
      this.callbacks.onSocialLogin({ loginParams });
    }
  };

  private setState = (newState: Partial<ModalState>) => {
    this.stateEmitter.emit("STATE_UPDATED", newState);
  };

  private handleConnectorData = (connectorData: IConnectorDataEvent) => {
    if (connectorData.connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) {
      const walletConnectData = connectorData.data as WalletConnectV2Data;
      if (walletConnectData.uri) {
        this.setState({ walletConnectUri: walletConnectData.uri });
      }
    }
    if (connectorData.connectorName === WALLET_CONNECTORS.METAMASK) {
      const metamaskData = connectorData.data as MetaMaskConnectorData;
      if (metamaskData.uri) {
        this.setState({ metamaskConnectUri: metamaskData.uri });
      }
    }
  };

  private subscribeCoreEvents = (listener: SafeEventEmitter<Web3AuthNoModalEvents>) => {
    listener.on(CONNECTOR_EVENTS.CONNECTING, (data) => {
      log.info("connecting with connector", data);
      // don't show loader in case of wallet connect, because currently it listens for incoming connections without any user interaction
      if (data?.connector === WALLET_CONNECTORS.WALLET_CONNECT_V2) return;

      // don't show loader in case of metamask qr code, because currently it listens for incoming connections without any user interaction
      const isMetamaskInjected = this.externalWalletsConfig?.[WALLET_CONNECTORS.METAMASK]?.isInjected;
      if (data?.connector === WALLET_CONNECTORS.METAMASK && !isMetamaskInjected && this.deviceDetails.platform === "desktop") return;

      this.setState({ status: MODAL_STATUS.CONNECTING });
    });
    listener.on(CONNECTOR_EVENTS.CONNECTED, (data: SDK_CONNECTED_EVENT_DATA) => {
      log.debug("connected with connector", data);
      // only show success if not being reconnected again.
      if (!data.reconnected && data.loginMode === LOGIN_MODE.MODAL) {
        this.setState({
          status: MODAL_STATUS.CONNECTED,
          modalVisibility: true,
          postLoadingMessage: "modal.post-loading.connected",
          currentPage: PAGES.LOGIN_OPTIONS,
        });
      } else {
        this.setState({
          status: MODAL_STATUS.CONNECTED,
        });
      }
    });
    // TODO: send connector name in error
    listener.on(CONNECTOR_EVENTS.ERRORED, (error: Web3AuthError, loginMode: LoginModeType) => {
      log.error("error", error, error.message);
      if (loginMode === LOGIN_MODE.NO_MODAL) return;
      if (error.code === 5000) {
        if (this.uiConfig.displayErrorsOnModal)
          this.setState({
            modalVisibility: true,
            postLoadingMessage: error.message || "modal.post-loading.something-wrong",
            status: MODAL_STATUS.ERRORED,
          });
        else
          this.setState({
            modalVisibility: false,
          });
      } else {
        this.setState({
          modalVisibility: true,
          status: MODAL_STATUS.INITIALIZED,
        });
      }
    });
    listener.on(CONNECTOR_EVENTS.DISCONNECTED, () => {
      this.setState({ status: MODAL_STATUS.INITIALIZED, externalWalletsVisibility: false });
      // this.toggleMessage("");
    });
    listener.on(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, (connectorData: IConnectorDataEvent) => {
      this.handleConnectorData(connectorData);
    });
    listener.on(CONNECTOR_EVENTS.AUTHORIZING, () => {
      this.setState({ status: MODAL_STATUS.AUTHORIZING });
    });
    listener.on(CONNECTOR_EVENTS.AUTHORIZED, () => {
      this.setState({ status: MODAL_STATUS.AUTHORIZED });
    });
  };
}
