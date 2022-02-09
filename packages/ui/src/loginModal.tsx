/* eslint-disable no-console */
import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  ADAPTER_EVENTS,
  BaseAdapterConfig,
  CONNECTED_EVENT_DATA,
  IAdapterDataEvent,
  LoginMethodConfig,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  Web3AuthError,
} from "@web3auth/base";
import log from "loglevel";
import * as React from "react";
import * as ReactDOM from "react-dom";

import Modal from "./components/Modal";
import { ThemedContext } from "./context/ThemeContext";
import { LOGIN_MODAL_EVENTS, MODAL_STATUS, ModalState, SocialLoginsConfig, UIConfig } from "./interfaces";

const DEFAULT_LOGO_URL = {
  light: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
  dark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
};
function createWrapper(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "w3a-container");
  document.body.appendChild(wrapper);
  return wrapper;
}

export default class LoginModal extends SafeEventEmitter {
  private appLogo: string;

  private version: string;

  private isDark: boolean;

  private wrapper: HTMLDivElement;

  private walletConnectUri = "";

  private config: {
    socialLoginsConfig: SocialLoginsConfig;
    externalWalletsConfig: Record<string, BaseAdapterConfig>;
  } = {
    socialLoginsConfig: {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
    },
    externalWalletsConfig: {},
  };

  private state: ModalState = {
    externalWalletsVisibility: false,
    status: undefined,
    hasExternalWallets: false,
    externalWalletsInitialized: false,
    modalVisibility: false,
    postLoadingMessage: "",
  };

  constructor({ appLogo, version, adapterListener, theme = "light" }: UIConfig) {
    super();
    this.appLogo = appLogo || DEFAULT_LOGO_URL[theme];
    this.version = version;
    this.isDark = theme === "dark";
    this.wrapper = createWrapper();
    this.setState({
      status: MODAL_STATUS.INITIALIZED,
    });
    this.subscribeCoreEvents(adapterListener);
  }

  addSocialLogins = (adapter: WALLET_ADAPTER_TYPE, loginMethods: LoginMethodConfig, loginMethodsOrder: string[]): void => {
    this.config = {
      ...this.config,
      socialLoginsConfig: {
        adapter,
        loginMethods,
        loginMethodsOrder,
      },
    };
  };

  addWalletLogins = (externalWalletsConfig: Record<string, BaseAdapterConfig>, options: { showExternalWalletsOnly: boolean }): void => {
    this.config = {
      ...this.config,
      externalWalletsConfig: {
        ...externalWalletsConfig,
      },
    };
    this.setState({
      externalWalletsInitialized: true,
      externalWalletsVisibility: !!options.showExternalWalletsOnly,
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
    });
    this.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, false);
  };

  initExternalWalletContainer = () => {
    this.setState({
      hasExternalWallets: true,
    });
  };

  private reinitializeModal = () => {
    this.setState({
      modalVisibility: true,
      status: MODAL_STATUS.INITIALIZED,
    });
  };

  private handleShowExternalWallets = () => {
    this.emit(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, { externalWalletsInitialized: this.state.externalWalletsInitialized });
  };

  private handleExternalWalletClick = (params) => {
    console.log("external wallet clicked", params);
    const { adapter } = params;
    this.emit(LOGIN_MODAL_EVENTS.LOGIN, {
      adapter,
    });
  };

  private handleSocialLoginClick = (params) => {
    console.log("social login clicked", params);
    const { adapter, loginParams } = params;
    this.emit(LOGIN_MODAL_EVENTS.LOGIN, {
      adapter,
      loginParams: { loginProvider: loginParams.loginProvider, login_hint: loginParams.login_hint },
    });
  };

  private renderModal(): void {
    ReactDOM.render(
      this.state.modalVisibility ? (
        <ThemedContext.Provider
          value={{
            isDark: this.isDark,
          }}
        >
          <Modal
            reinitializeModal={this.reinitializeModal}
            closeModal={this.closeModal}
            hasExternalWallets={this.state.hasExternalWallets || Object.keys(this.config.externalWalletsConfig || {}).length > 0}
            handleShowExternalWallets={() => this.handleShowExternalWallets()}
            handleExternalWalletClick={(params) => this.handleExternalWalletClick(params)}
            handleSocialLoginClick={(params) => this.handleSocialLoginClick(params)}
            modalState={this.state}
            walletConnectUri={this.walletConnectUri}
            externalWallets={this.config.externalWalletsConfig}
            socialLoginsConfig={this.config.socialLoginsConfig}
            appLogo={this.appLogo}
            version={this.version}
          />
        </ThemedContext.Provider>
      ) : (
        <></>
      ),
      this.wrapper
    );
  }

  private setState = (newState: Partial<ModalState>) => {
    this.state = { ...this.state, ...newState };

    this.renderModal();
  };

  private updateWalletConnect = (walletConnectUri: string): void => {
    if (!walletConnectUri) return;
    this.walletConnectUri = walletConnectUri;
    this.renderModal();
  };

  private handleAdapterData = (adapterData: IAdapterDataEvent) => {
    if (adapterData.adapterName === WALLET_ADAPTERS.WALLET_CONNECT_V1) {
      const walletConnectData = adapterData.data as WalletConnectV1Data;
      this.updateWalletConnect(walletConnectData.uri);
    }
  };

  private subscribeCoreEvents = (listener: SafeEventEmitter) => {
    listener.on(ADAPTER_EVENTS.CONNECTING, (data) => {
      console.log("connecting with adapter", data);
      // don't show loader in case of wallet connect, because currently it listens for incoming for incoming
      // connections without any user interaction.
      if (data?.adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V1 && data?.adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V2) {
        // const provider = data?.loginProvider || "";

        this.setState({ status: MODAL_STATUS.CONNECTING });
      }
    });
    listener.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
      log.debug("connected with adapter", this.state.status, data);
      if (this.state.status !== "connected") {
        // only show success if not being reconnected again.
        if (!data.reconnected) {
          this.setState({
            status: MODAL_STATUS.CONNECTED,
            postLoadingMessage: "You are connected with your account",
          });
        } else {
          this.setState({
            status: MODAL_STATUS.CONNECTED,
          });
        }
      }
    });
    listener.on(ADAPTER_EVENTS.ERRORED, (error: Web3AuthError) => {
      log.error("error", error, error.message);
      this.setState({
        modalVisibility: true,
        postLoadingMessage: error.message || "Something went wrong!",
        status: MODAL_STATUS.ERRORED,
      });
    });
    listener.on(ADAPTER_EVENTS.DISCONNECTED, () => {
      this.setState({ status: MODAL_STATUS.INITIALIZED });
      // this.toggleMessage("");
    });
    listener.on(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, (adapterData: IAdapterDataEvent) => {
      this.handleAdapterData(adapterData);
    });
  };
}
