import "./css/index.css";

import { applyWhiteLabelTheme, LANGUAGES, SafeEventEmitter } from "@web3auth/auth";
import {
  BaseConnectorConfig,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CONNECTOR_EVENTS,
  IConnectorDataEvent,
  log,
  LoginMethodConfig,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletConnectV2Data,
  WalletRegistry,
  Web3AuthError,
  Web3AuthNoModalEvents,
} from "@web3auth/no-modal";
import { createRoot } from "react-dom/client";

// import Modal from "./components/Modal";
import Widget from "./components-base/Widget";
import { ThemedContext } from "./context/ThemeContext";
import {
  DEFAULT_LOGO_DARK,
  DEFAULT_LOGO_LIGHT,
  ExternalWalletEventType,
  LOGIN_MODAL_EVENTS,
  LoginModalProps,
  MODAL_STATUS,
  ModalState,
  SocialLoginEventType,
  StateEmitterEvents,
  UIConfig,
  WIDGET_TYPE,
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

export class LoginModal extends SafeEventEmitter {
  private uiConfig: UIConfig;

  private stateEmitter: SafeEventEmitter<StateEmitterEvents>;

  private chainNamespace: ChainNamespaceType;

  private walletRegistry: WalletRegistry;

  constructor(uiConfig: LoginModalProps) {
    super();
    this.uiConfig = uiConfig;

    if (!uiConfig.logoDark) this.uiConfig.logoDark = DEFAULT_LOGO_DARK;
    if (!uiConfig.logoLight) this.uiConfig.logoLight = DEFAULT_LOGO_LIGHT;
    if (!uiConfig.mode) this.uiConfig.mode = "light";
    if (!uiConfig.modalZIndex) this.uiConfig.modalZIndex = "99998";
    if (typeof uiConfig.displayErrorsOnModal === "undefined") this.uiConfig.displayErrorsOnModal = true;
    if (!uiConfig.appName) this.uiConfig.appName = "Web3Auth";
    if (!uiConfig.loginGridCol) this.uiConfig.loginGridCol = 3;
    if (!uiConfig.primaryButton) this.uiConfig.primaryButton = "socialLogin";
    if (!uiConfig.defaultLanguage) this.uiConfig.defaultLanguage = getUserLanguage(uiConfig.defaultLanguage);
    if (!uiConfig.widget) this.uiConfig.widget = WIDGET_TYPE.MODAL;

    if (uiConfig.widget === WIDGET_TYPE.EMBED && !uiConfig.targetId) {
      log.error("targetId is required for embed widget");
      throw new Error("targetId is required for embed widget");
    }

    this.stateEmitter = new SafeEventEmitter<StateEmitterEvents>();
    this.chainNamespace = uiConfig.chainNamespace;
    this.walletRegistry = uiConfig.walletRegistry;
    this.subscribeCoreEvents(this.uiConfig.connectorListener);
  }

  get isDark(): boolean {
    return this.uiConfig.mode === "dark" || (this.uiConfig.mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  initModal = async (): Promise<void> => {
    const darkState = { isDark: this.isDark };

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

      if (this.uiConfig.widget === WIDGET_TYPE.MODAL) {
        createWrapperForModal(this.uiConfig.modalZIndex);
      } else {
        createWrapperForEmbed(this.uiConfig.targetId);
      }

      const container = document.getElementById("w3a-parent-container");

      if (darkState.isDark) {
        container.classList.add("w3a--dark");
      } else {
        container.classList.remove("w3a--dark");
      }

      const root = createRoot(container);
      root.render(
        <ThemedContext.Provider value={darkState}>
          <Widget
            closeModal={this.closeModal}
            stateListener={this.stateEmitter}
            handleShowExternalWallets={this.handleShowExternalWallets}
            handleExternalWalletClick={this.handleExternalWalletClick}
            handleSocialLoginClick={this.handleSocialLoginClick}
            appLogo={darkState.isDark ? this.uiConfig.logoDark : this.uiConfig.logoLight}
            appName={this.uiConfig.appName}
            chainNamespace={this.chainNamespace}
            walletRegistry={this.walletRegistry}
            widget={this.uiConfig.widget}
          />
        </ThemedContext.Provider>
      );

      if (this.uiConfig?.theme) {
        const rootElement = document.getElementById("w3a-parent-container") as HTMLElement;
        applyWhiteLabelTheme(rootElement, this.uiConfig.theme);
      }
    });
  };

  addSocialLogins = (
    connector: WALLET_CONNECTOR_TYPE,
    loginMethods: LoginMethodConfig,
    loginMethodsOrder: string[],
    uiConfig: Omit<UIConfig, "connectorListener">
  ): void => {
    this.setState({
      socialLoginsConfig: {
        connector,
        loginMethods,
        loginMethodsOrder,
        uiConfig,
      },
    });
    log.info("addSocialLogins", connector, loginMethods, loginMethodsOrder, uiConfig);
  };

  addWalletLogins = (externalWalletsConfig: Record<string, BaseConnectorConfig>, options: { showExternalWalletsOnly: boolean }): void => {
    this.setState({
      externalWalletsConfig,
      externalWalletsInitialized: true,
      showExternalWalletsOnly: !!options?.showExternalWalletsOnly,
      externalWalletsVisibility: true,
    });
  };

  open = () => {
    this.setState({
      modalVisibility: true,
    });
    this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, true);
  };

  closeModal = () => {
    this.setState({
      modalVisibility: false,
      externalWalletsVisibility: false,
    });
    this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, false);
  };

  initExternalWalletContainer = () => {
    this.setState({
      hasExternalWallets: true,
    });
  };

  private handleShowExternalWallets = (status: boolean) => {
    this.emit(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, { externalWalletsInitialized: status });
  };

  private handleExternalWalletClick = (params: ExternalWalletEventType) => {
    log.info("external wallet clicked", params);
    const { connector } = params;
    this.emit(LOGIN_MODAL_EVENTS.LOGIN, {
      connector,
    });
  };

  private handleSocialLoginClick = (params: SocialLoginEventType) => {
    log.info("social login clicked", params);
    const { connector, loginParams } = params;
    this.emit(LOGIN_MODAL_EVENTS.LOGIN, {
      connector,
      loginParams: { loginProvider: loginParams.loginProvider, login_hint: loginParams.login_hint, name: loginParams.name },
    });
  };

  private setState = (newState: Partial<ModalState>) => {
    this.stateEmitter.emit("STATE_UPDATED", newState);
  };

  private updateWalletConnect = (walletConnectUri: string): void => {
    if (!walletConnectUri) return;
    this.setState({
      walletConnectUri,
    });
  };

  private handleConnectorData = (connectorData: IConnectorDataEvent) => {
    if (connectorData.connectorName === WALLET_CONNECTORS.WALLET_CONNECT_V2) {
      const walletConnectData = connectorData.data as WalletConnectV2Data;
      this.updateWalletConnect(walletConnectData.uri);
    }
  };

  private subscribeCoreEvents = (listener: SafeEventEmitter<Web3AuthNoModalEvents>) => {
    listener.on(CONNECTOR_EVENTS.CONNECTING, (data) => {
      log.info("connecting with connector", data);
      // don't show loader in case of wallet connect, because currently it listens for incoming for incoming
      // connections without any user interaction.
      if (data?.connector !== WALLET_CONNECTORS.WALLET_CONNECT_V2) {
        // const provider = data?.loginProvider || "";

        this.setState({ status: MODAL_STATUS.CONNECTING });
      }
    });
    listener.on(CONNECTOR_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
      log.debug("connected with connector", data);
      // only show success if not being reconnected again.
      if (!data.reconnected) {
        this.setState({
          status: MODAL_STATUS.CONNECTED,
          modalVisibility: true,
          postLoadingMessage: "modal.post-loading.connected",
        });
      } else {
        this.setState({
          status: MODAL_STATUS.CONNECTED,
        });
      }
    });
    // TODO: send connector name in error
    listener.on(CONNECTOR_EVENTS.ERRORED, (error: Web3AuthError) => {
      log.error("error", error, error.message);
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
  };
}
