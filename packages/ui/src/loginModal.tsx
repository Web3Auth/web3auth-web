import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  ADAPTER_EVENTS,
  BaseAdapterConfig,
  CONNECTED_EVENT_DATA,
  IAdapterDataEvent,
  IWalletConnectExtensionAdapter,
  log,
  LoginMethodConfig,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  Web3AuthError,
} from "@web3auth/base";
import i18n from "i18next";
import { createRoot } from "react-dom/client";
import { initReactI18next } from "react-i18next";

import Modal from "./components/Modal";
import { ThemedContext } from "./context/ThemeContext";
// import { de, en, es, ja, ko, zh } from "./i18n";
import { en } from "./i18n";
import { ExternalWalletEventType, LOGIN_MODAL_EVENTS, MODAL_STATUS, ModalState, SocialLoginEventType, UIConfig } from "./interfaces";
import { languageMap } from "./utils";

const DEFAULT_LOGO_URL = "https://images.web3auth.io/web3auth-logo.svg";
function createWrapper(): HTMLElement {
  const wrapper = document.createElement("section");
  wrapper.setAttribute("id", "w3a-container");
  document.body.appendChild(wrapper);
  return wrapper;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    // de: { translation: de },
    // es: { translation: es },
    // ja: { translation: ja },
    // ko: { translation: ko },
    // zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default class LoginModal extends SafeEventEmitter {
  private appLogo: string;

  private version: string;

  private isDark: boolean;

  private stateEmitter: SafeEventEmitter;

  private displayErrorsOnModal = true;

  private defaultLanguage: string;

  constructor({ appLogo, version, adapterListener, theme = "light", displayErrorsOnModal = true, defaultLanguage }: UIConfig) {
    super();
    this.appLogo = appLogo || DEFAULT_LOGO_URL;
    this.version = version;
    this.isDark = theme === "dark";
    this.stateEmitter = new SafeEventEmitter();
    this.displayErrorsOnModal = displayErrorsOnModal;
    this.defaultLanguage = defaultLanguage;
    this.subscribeCoreEvents(adapterListener);
  }

  initModal = async (): Promise<void> => {
    const darkState = { isDark: this.isDark };

    const useLang = this.defaultLanguage || "en";

    // Load new language resource
    if (useLang !== "en") {
      import(/* webpackChunkName: "lang-[request]" */ `./i18n/${languageMap[useLang]}.json`)
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
      const container = createWrapper();
      const root = createRoot(container);
      root.render(
        <ThemedContext.Provider value={darkState}>
          <Modal
            closeModal={this.closeModal}
            stateListener={this.stateEmitter}
            handleShowExternalWallets={(externalWalletsInitialized: boolean) => this.handleShowExternalWallets(externalWalletsInitialized)}
            handleExternalWalletClick={(params) => this.handleExternalWalletClick(params)}
            handleSocialLoginClick={(params) => this.handleSocialLoginClick(params)}
            appLogo={this.appLogo}
            version={this.version}
          />
        </ThemedContext.Provider>
      );
    });
  };

  addSocialLogins = (adapter: WALLET_ADAPTER_TYPE, loginMethods: LoginMethodConfig, loginMethodsOrder: string[]): void => {
    this.setState({
      socialLoginsConfig: {
        adapter,
        loginMethods,
        loginMethodsOrder,
      },
    });
    log.info("addSocialLogins", adapter, loginMethods, loginMethodsOrder);
  };

  addWalletLogins = (externalWalletsConfig: Record<string, BaseAdapterConfig>, options: { showExternalWalletsOnly: boolean }): void => {
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
    const { adapter } = params;
    this.emit(LOGIN_MODAL_EVENTS.LOGIN, {
      adapter,
    });
  };

  private handleSocialLoginClick = (params: SocialLoginEventType) => {
    log.info("social login clicked", params);
    const { adapter, loginParams } = params;
    this.emit(LOGIN_MODAL_EVENTS.LOGIN, {
      adapter,
      loginParams: { loginProvider: loginParams.loginProvider, login_hint: loginParams.login_hint },
    });
  };

  private setState = (newState: Partial<ModalState>) => {
    this.stateEmitter.emit("STATE_UPDATED", newState);
  };

  private updateWalletConnect = (walletConnectUri: string, wcAdapters: IWalletConnectExtensionAdapter[]): void => {
    if (!walletConnectUri) return;
    this.setState({
      walletConnectUri,
      wcAdapters,
    });
  };

  private handleAdapterData = (adapterData: IAdapterDataEvent) => {
    if (adapterData.adapterName === WALLET_ADAPTERS.WALLET_CONNECT_V1) {
      const walletConnectData = adapterData.data as WalletConnectV1Data;
      this.updateWalletConnect(walletConnectData.uri, walletConnectData.extensionAdapters);
    }
  };

  private subscribeCoreEvents = (listener: SafeEventEmitter) => {
    listener.on(ADAPTER_EVENTS.CONNECTING, (data) => {
      log.info("connecting with adapter", data);
      // don't show loader in case of wallet connect, because currently it listens for incoming for incoming
      // connections without any user interaction.
      if (data?.adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V1 && data?.adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V2) {
        // const provider = data?.loginProvider || "";

        this.setState({ status: MODAL_STATUS.CONNECTING });
      }
    });
    listener.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
      log.debug("connected with adapter", data);
      // only show success if not being reconnected again.
      if (!data.reconnected) {
        this.setState({
          status: MODAL_STATUS.CONNECTED,
          modalVisibility: true,
          postLoadingMessage: "You are connected with your account",
        });
      } else {
        this.setState({
          status: MODAL_STATUS.CONNECTED,
        });
      }
    });
    listener.on(ADAPTER_EVENTS.ERRORED, (error: Web3AuthError) => {
      log.error("error", error, error.message);
      if (error.code === 5000) {
        if (this.displayErrorsOnModal)
          this.setState({
            modalVisibility: true,
            postLoadingMessage: error.message || "Something went wrong!",
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
    listener.on(ADAPTER_EVENTS.DISCONNECTED, () => {
      this.setState({ status: MODAL_STATUS.INITIALIZED, externalWalletsVisibility: false });
      // this.toggleMessage("");
    });
    listener.on(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, (adapterData: IAdapterDataEvent) => {
      this.handleAdapterData(adapterData);
    });
  };
}
