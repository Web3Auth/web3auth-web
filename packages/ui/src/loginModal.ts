import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import {
  BASE_ADAPTER_EVENTS,
  BaseAdapterConfig,
  LoginMethodConfig,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
  WalletConnectV1Data,
  Web3AuthError,
} from "@web3auth/base";
import log from "loglevel";
import QRCode from "qrcode";

import AllImages from "../assets";
import { LOGIN_MODAL_EVENTS, UIConfig } from "./interfaces";
import { htmlToElement } from "./utils";
const hasLightIcons = ["apple", "github"];
export default class LoginModal extends SafeEventEmitter {
  public $modal!: HTMLDivElement;

  private appLogo: string;

  private version: string;

  private isDark: boolean;

  private hasSocialWallet = false;

  private hasSocialEmailWallet = false;

  private showExternalWallets: () => void;

  private state = {
    initialized: false,
    connected: false,
    connecting: false,
    externalWalletsInitialized: false,
    errored: false,
  };

  constructor({ appLogo, version, adapterListener, isDark = false }: UIConfig) {
    super();
    this.appLogo = appLogo;
    this.version = version;
    this.isDark = isDark;
    this.subscribeCoreEvents(adapterListener);
  }

  get initialized() {
    return this.state.initialized;
  }

  init() {
    const web3authIcon = AllImages[`web3auth${this.isDark ? "-light" : ""}`].image;
    const closeIcon = AllImages.close.image;
    this.$modal = htmlToElement(`
        <div id="w3a-modal" class="w3a-modal w3a-modal--hidden${this.isDark ? "" : " w3a-modal--light"}">
            <div class="w3a-modal__inner w3ajs-inner">
                <div class="w3a-modal__header">
                    <div class="w3a-header">
                        <img class="w3a-header__logo" src="${this.appLogo}" alt="">
                        <div>
                            <h1 class="w3a-header__title">Sign in</h1>
                            <p class="w3a-header__subtitle">Select one of the following to continue</p>
                        </div>
                    </div>
                    <button class="w3a-header__button w3ajs-close-btn">
                        ${closeIcon}
                    </button>
                </div>
                <div class="w3a-modal__content w3ajs-content"></div>
                <div class="w3a-modal__footer">
                    <div class="w3a-footer">
                        <div>
                            <div class="w3a-footer__links">
                              <a href="">Terms of use</a>
                              <span>|</span>
                              <a href="">Privacy policy</a>
                            </div>
                            <p>${this.version}</p>
                        </div>
                        <div class="w3a-footer__secured">
                          <div>Secured by</div>
                          ${web3authIcon}
                        </div>
                    </div>
                </div>
                <div class="w3ajs-modal-loader w3a-modal__loader w3a-modal__loader--hidden">
                    <div class="w3a-modal__loader-content">
                        <div class="w3a-modal__loader-info">
                          <div class="w3ajs-modal-loader__spinner w3a-spinner"><div></div><div></div><div></div><div></div></div>
                          <div class="w3ajs-modal-loader__label w3a-spinner-label"></div>
                          <div class="w3ajs-modal-loader__message w3a-spinner-message" style="display: none"></div>
                        </div>
                        <div class="w3a-spinner-power">
                          <div>Secured by</div>
                          ${web3authIcon}
                        </div>
                    </div>
                    <button class="w3a-header__button w3ajs-loader-close-btn">
                      ${closeIcon}
                    </button>
                </div>
            </div>
        </div>
    `);
    const $content = this.$modal.querySelector(".w3ajs-content");

    const $closeBtn = this.$modal.querySelector(".w3ajs-close-btn") as HTMLButtonElement;

    const $loaderCloseBtn = this.$modal.querySelector(".w3ajs-loader-close-btn");

    const $torusWallet = this.getSocialLogins();
    const $torusWalletEmail = this.getSocialLoginsEmail();
    const $externalWallet = this.getExternalWallet();

    const $externalToggle = $externalWallet.querySelector(".w3ajs-external-toggle");
    const $externalToggleButton = $externalToggle?.querySelector(".w3ajs-external-toggle__button");
    const $externalBackButton = $externalWallet.querySelector(".w3ajs-external-back");
    const $externalContainer = $externalWallet.querySelector(".w3ajs-external-container");

    this.showExternalWallets = () => {
      $externalToggle?.classList.toggle("w3a-external-toggle--hidden");
      $externalContainer?.classList.toggle("w3a-external-container--hidden");
      $torusWallet.classList.toggle("w3a-group--hidden");
      $torusWalletEmail.classList.toggle("w3a-group--hidden");
    };

    $externalToggleButton?.addEventListener("click", () => {
      this.emit(LOGIN_MODAL_EVENTS.INIT_EXTERNAL_WALLETS, { externalWalletsInitialized: this.state.externalWalletsInitialized });
      this.showExternalWallets();
    });

    $externalBackButton?.addEventListener("click", () => {
      $externalToggle?.classList.toggle("w3a-external-toggle--hidden");
      $externalContainer?.classList.toggle("w3a-external-container--hidden");
      $torusWallet.classList.toggle("w3a-group--hidden");
      $torusWalletEmail.classList.toggle("w3a-group--hidden");
    });

    $closeBtn.addEventListener("click", () => this.toggleModal());

    $loaderCloseBtn?.addEventListener("click", () => {
      const errorModal = this.$modal.classList.contains("w3a-modal--error");
      if (this.state.connected || errorModal) {
        this.toggleMessage("");
        this.toggleModal();
      } else {
        this.toggleMessage("");
      }
    });

    $content?.appendChild($torusWallet);
    $content?.appendChild($torusWalletEmail);
    $content?.appendChild($externalWallet);

    document.body.appendChild(this.$modal);
    this.state.initialized = true;
  }

  toggleModal = (isErrorOnly = false): void => {
    const hideClass = "w3a-modal--hidden";
    const $inner = this.$modal.querySelector(".w3ajs-inner");

    if (isErrorOnly) {
      this.$modal.classList.add("w3a-modal--error");
    } else {
      this.$modal.classList.remove("w3a-modal--error");
    }

    if (this.$modal.classList.contains(hideClass)) {
      this.$modal.classList.remove(hideClass);
      setTimeout(() => {
        $inner.classList.add("w3a-modal__inner--active");
      }, 100);
    } else {
      $inner.classList.remove("w3a-modal__inner--active");
      setTimeout(() => {
        this.$modal.classList.add(hideClass);
      }, 200);
    }

    // Go to modal main
    const $externalContainer = this.$modal.querySelector(".w3ajs-external-container") as HTMLButtonElement;
    const $externalToggle = this.$modal.querySelector(".w3ajs-external-toggle");
    const $socialLogins = this.$modal.querySelector(".w3ajs-social-logins");
    const $socialEmailPasswordless = this.$modal.querySelector(".w3ajs-email-passwordless");

    if (!$externalContainer.classList.contains("w3a-external-container--hidden")) {
      $externalContainer?.classList.add("w3a-external-container--hidden");
      $externalToggle?.classList.remove("w3a-external-toggle--hidden");
      $socialLogins.classList.remove("w3a-group--hidden");
      $socialEmailPasswordless.classList.remove("w3a-group--hidden");
    }

    // Hide other social logins
    const $socialAdapters = $socialLogins.querySelector(".w3ajs-socials-adapters") as HTMLUListElement;
    const $socialAdapterExpandText = $socialLogins.querySelector(".w3ajs-button-expand-text") as HTMLSpanElement;
    $socialAdapterExpandText.innerText = "View more options";
    $socialAdapters.classList.add("w3a-adapter-list--shrink");

    if (!this.hasSocialEmailWallet && !this.hasSocialWallet) {
      this.showExternalWallets();
    }
  };

  addSocialLogins = (adapter: WALLET_ADAPTER_TYPE, adapterConfig: BaseAdapterConfig, loginMethods: LoginMethodConfig): void => {
    const $socialLogins = this.$modal.querySelector(".w3ajs-social-logins") as HTMLDivElement;
    const $adapterList = $socialLogins.querySelector(".w3ajs-socials-adapters") as HTMLDivElement;
    const $adapterExpandBtn = $socialLogins.querySelector(".w3ajs-button-expand") as HTMLButtonElement;

    if (Object.keys(loginMethods).length > 5) $adapterExpandBtn.style.display = "flex";

    Object.keys(loginMethods).forEach((method: string) => {
      if (method === "email_passwordless") {
        this.hasSocialEmailWallet = true;
        const $emailPasswordlessSection = this.$modal.querySelector(".w3ajs-email-passwordless") as HTMLDivElement;
        $emailPasswordlessSection.classList.remove("w3a-group--email-hidden");
        const $emailPasswordlessForm = $emailPasswordlessSection.querySelector(".w3ajs-email-passwordless-form") as HTMLDivElement;
        $emailPasswordlessForm.addEventListener("submit", (event: Event) => {
          event.preventDefault();
          const data = new FormData(event.target as HTMLFormElement);
          const email = data.get("email");
          if (email) this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter, loginParams: { loginProvider: method, loginHint: email } });
        });
        return;
      } else if (method === "webauthn" || method === "jwt") {
        return;
      }
      this.hasSocialWallet = true;
      $socialLogins.classList.remove("w3a-group--social-hidden");
      const providerIcon = AllImages[`login-${method}${this.isDark && hasLightIcons.includes(method) ? "-light" : ""}`].image;
      const adapterButton = htmlToElement(`
            <li class="w3a-adapter-item">
                <button class="w3a-button w3a-button--icon">
                  ${providerIcon}
                </button>
            </li>          
        `);

      adapterButton.addEventListener("click", () => {
        this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter, loginParams: { loginProvider: method } });
      });

      $adapterList.append(adapterButton);
    });
  };

  addWalletLogins = (
    adaptersConfig: Record<string, BaseAdapterConfig>,
    adaptersData: Record<string, unknown>,
    options?: { showExternalWallets: boolean }
  ): void => {
    log.info("adaptersConfig", adaptersConfig);
    log.info("adaptersData", adaptersData);

    if (options.showExternalWallets) {
      this.showExternalWallets();
    }
    const $externalWallet = this.$modal.querySelector(".w3ajs-external-wallet") as HTMLDivElement;
    const $adapterList = $externalWallet.querySelector(".w3ajs-wallet-adapters") as HTMLDivElement;
    const $loader = $externalWallet.querySelector(".w3ajs-external-loader") as HTMLDivElement;

    if (!this.hasSocialEmailWallet && !this.hasSocialWallet) {
      const $externalToggle = this.$modal.querySelector(".w3ajs-external-toggle") as HTMLDivElement;
      const $externalContainer = this.$modal.querySelector(".w3ajs-external-container") as HTMLDivElement;
      const $externalBack = $externalContainer.querySelector(".w3ajs-external-back") as HTMLDivElement;

      $externalToggle.classList.add("w3a-external-toggle--hidden");
      $externalContainer.classList.remove("w3a-external-container--hidden");
      $externalBack.remove();
    }

    const adapterKeys = Object.keys(adaptersConfig);
    // TODO: Get Previous Login
    const prevAdapter = "";
    if (prevAdapter) {
      adapterKeys.splice(adapterKeys.indexOf(prevAdapter), 1);
      const prevAdapterIcon = AllImages[`login-${prevAdapter as string}`].image;

      // Add main adapter
      const mainAdapterSection = htmlToElement(`
      <div class="w3a-external-group">
        <div class="w3a-external-group__left">
            <button class="w3ajs-${prevAdapter} w3a-button w3a-button--left">
                ${prevAdapterIcon}
                <div class="w3a-button__name">${prevAdapter}</div>
                <div class="w3a-button__note">Detected</div>
            </button>
        </div>
      </div>
    `);
      const $mainAdapterButton = mainAdapterSection.querySelector(`.w3ajs-${prevAdapter}`) as HTMLDivElement;
      $mainAdapterButton.addEventListener("click", () => {
        this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter: prevAdapter });
      });

      $adapterList.before(mainAdapterSection);
    }

    adapterKeys.forEach((adapter) => {
      if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
        const data = adaptersData[adapter] as WalletConnectV1Data;
        log.info("uri for wallet connect qr code", data?.uri);
        this.addWalletConnect(data?.uri);
        // fire connect event and so that it will be start listening for incoming connections / qr code scans.
        this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter });
        return;
      }
      $externalWallet.classList.remove("w3a-group--ext-wallet-hidden");
      const providerIcon = AllImages[`login-${adapter}`].image;
      const adapterButton = htmlToElement(`
            <li class="w3a-adapter-item">
                <button class="w3a-button w3a-button--icon">
                  ${providerIcon}
                </button>
                <p class="w3a-adapter-item__label">${adaptersConfig[adapter]?.label || adapter}</p>
            </li>   
        `);

      adapterButton.addEventListener("click", () => {
        this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter });
      });

      $adapterList.appendChild(adapterButton);
    });
    $loader.style.display = "none";

    this.state = {
      ...this.state,
      externalWalletsInitialized: true,
    };
  };

  private async addWalletConnect(qrCodeUri: string) {
    const qrCode = await QRCode.toDataURL(qrCodeUri);
    log.debug("wallet connect qr code uri", qrCode);
    const $walletConnect = this.$modal.querySelector(".w3ajs-wallet-connect") as HTMLDivElement;
    const $qrImage = this.$modal.querySelector(".w3ajs-wallet-connect-qr") as HTMLImageElement;
    $walletConnect.classList.remove("w3a-wallet-connect--hidden");

    $qrImage.src = qrCode;
  }

  private getSocialLogins(): HTMLDivElement {
    const expandIcon = AllImages[`expand${this.isDark ? "-light" : ""}`].image;
    const $socialLogins = htmlToElement(`
        <div class="w3ajs-social-logins w3a-group w3a-group--social-hidden">
            <h6 class="w3a-group__title">CONTINUE WITH</h6>
            <ul class="w3a-adapter-list w3a-adapter-list--shrink w3ajs-socials-adapters"></ul>
            <button class="w3a-button-expand w3ajs-button-expand" style="display: none;">
              ${expandIcon}
              <span class="w3ajs-button-expand-text">View more options</span>
            </button>
        </div>
    `) as HTMLDivElement;

    const $adapterList = $socialLogins.querySelector(".w3ajs-socials-adapters") as HTMLDivElement;
    const $adapterExpandBtn = $socialLogins.querySelector(".w3ajs-button-expand") as HTMLButtonElement;
    const $adapterExpandText = $adapterExpandBtn.querySelector(".w3ajs-button-expand-text") as HTMLSpanElement;
    $adapterExpandBtn.addEventListener("click", () => {
      $adapterList.classList.toggle("w3a-adapter-list--shrink");
      $adapterExpandBtn.classList.toggle("w3a-button--rotate");
      if ($adapterExpandBtn.classList.contains("w3a-button--rotate")) {
        $adapterExpandText.innerText = "View less options";
      } else {
        $adapterExpandText.innerText = "View more options";
      }
    });

    return $socialLogins;
  }

  private getSocialLoginsEmail = (): HTMLDivElement => {
    const $socialEmail = htmlToElement(`
        <div class="w3ajs-email-passwordless w3a-group w3a-group--email-hidden">
            <h6 class="w3a-group__title">EMAIL</h6>
          <form class="w3ajs-email-passwordless-form">
            <input class="w3a-text-field" type="email" name="email" required placeholder="Email">
            <button class="w3a-button" type="submit">Continue with Email</button>
        </form>
        </div>
    `) as HTMLDivElement;

    return $socialEmail;
  };

  private getExternalWallet = (): HTMLDivElement => {
    const arrowLeftIcon = AllImages["arrow-left"].image;
    const walletConnectIcon = AllImages.walletConnect.image;
    const $externalWallet = htmlToElement(`
        <div class="w3ajs-external-wallet w3a-group">
            <div class="w3a-external-toggle w3ajs-external-toggle">
                <h6 class="w3a-group__title">EXTERNAL WALLET</h6>
                <button class="w3a-button w3ajs-external-toggle__button">Connect with Wallet</button>
            </div>
            <div class="w3a-external-container w3a-external-container--hidden w3ajs-external-container">
              <button class="w3a-external-back w3ajs-external-back">
                  ${arrowLeftIcon}
                  <h6 class="w3a-group__title">Back</h6>
              </button>

              <!-- Wallet Connect -->
              <div class="w3ajs-wallet-connect w3a-wallet-connect w3a-wallet-connect--hidden">
                  <i class="w3a-wallet-connect__logo">${walletConnectIcon}</i>
                  <div class="w3ajs-wallet-connect__container w3a-wallet-connect__container">
                    <div>Scan QR code with a WalletConnect-compatible wallet</div>
                    <img class="w3ajs-wallet-connect-qr w3a-wallet-connect-qr" src="" />
                  </div>
              </div>
              <!-- Other Wallet -->
              <div class="w3a-external-loader w3ajs-external-loader">
                <div class="w3ajs-modal-loader__spinner w3a-spinner w3a-spinner--small"><div></div><div></div><div></div><div></div></div>
              </div>
              <ul class="w3a-adapter-list w3ajs-wallet-adapters"></ul>
            </div>
        </div>
    `) as HTMLDivElement;

    return $externalWallet;
  };

  private toggleLoader() {
    const $loader = this.$modal.querySelector(".w3ajs-modal-loader");
    // const $loaderLabel = this.$modal.querySelector(".w3ajs-modal-loader__label") as HTMLDivElement;
    if (this.state.connecting) {
      $loader.classList.remove("w3a-modal__loader--hidden");
      // $loaderLabel.style.display = "block";
      // $loaderLabel.innerText = provider;
    } else {
      $loader.classList.add("w3a-modal__loader--hidden");
      // $loaderLabel.style.display = "none";
      // $loaderLabel.innerText = "";
    }
  }

  private toggleMessage(message: string, type = "") {
    const $loader = this.$modal.querySelector(".w3ajs-modal-loader");
    const $loaderSpinner = $loader.querySelector(".w3ajs-modal-loader__spinner") as HTMLDivElement;
    const $loaderLabel = $loader.querySelector(".w3ajs-modal-loader__label") as HTMLDivElement;
    const $loaderMessage = $loader.querySelector(".w3ajs-modal-loader__message") as HTMLDivElement;
    const $loaderClose = $loader.querySelector(".w3ajs-loader-close-btn") as HTMLDivElement;

    $loaderLabel.style.display = "none";
    if (message) {
      $loader.classList.remove("w3a-modal__loader--hidden");
      $loaderSpinner.style.display = "none";
      $loaderMessage.style.display = "block";
      $loaderClose.style.display = "block";
      $loaderMessage.innerText = message;
    } else {
      $loader.classList.add("w3a-modal__loader--hidden");
      $loaderSpinner.style.display = "block";
      $loaderMessage.style.display = "none";
      $loaderClose.style.display = "none";
      $loaderMessage.innerText = "";
    }

    if (type === BASE_ADAPTER_EVENTS.ERRORED) {
      $loaderSpinner.style.display = "none";
      $loaderMessage.classList.add("w3a-spinner-message--error");
    } else {
      $loaderMessage.classList.remove("w3a-spinner-message--error");
    }

    if (type === BASE_ADAPTER_EVENTS.CONNECTED) {
      $loaderSpinner.style.display = "none";
    }
  }

  private subscribeCoreEvents(listener: SafeEventEmitter) {
    listener.on(BASE_ADAPTER_EVENTS.CONNECTING, (data) => {
      log.debug("connecting with adapter", data);
      // don't show loader in case of wallet connect, because currently it listens for incoming for incoming
      // connections without any user interaction.
      if (data?.adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V1 && data?.adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V2) {
        // const provider = data?.loginProvider || "";
        this.state.connecting = true;
        this.state.connected = false;
        this.toggleLoader();
      }
    });
    listener.on(BASE_ADAPTER_EVENTS.CONNECTED, () => {
      this.state.connecting = false;
      log.debug("connected with adapter");
      if (!this.state.connected) {
        this.state.connected = true;
        this.toggleMessage("You are now connected to your wallet", BASE_ADAPTER_EVENTS.CONNECTED);
        setTimeout(() => {
          this.toggleMessage("");
          this.toggleModal();
        }, 3000);
      }
    });
    listener.on(BASE_ADAPTER_EVENTS.ERRORED, (error: Web3AuthError) => {
      log.error("error", error);
      this.state.connecting = false;
      this.state.connected = false;
      const hideClass = "w3a-modal--hidden";
      if (this.$modal.classList.contains(hideClass)) {
        this.toggleModal(true);
      }

      this.toggleMessage(error.message, BASE_ADAPTER_EVENTS.ERRORED);
    });
    listener.on(BASE_ADAPTER_EVENTS.DISCONNECTED, () => {
      this.state.connecting = false;
      this.state.connected = false;
      this.toggleMessage("");
    });
  }
}
