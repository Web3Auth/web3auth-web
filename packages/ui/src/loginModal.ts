import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BASE_WALLET_EVENTS, BaseAdapterConfig, CommonLoginOptions, LoginMethodConfig, WALLET_ADAPTER_TYPE, WalletError } from "@web3auth/base";

import { icons, images } from "../assets";
import { LOGIN_MODAL_EVENTS, UIConfig } from "./interfaces";

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

  constructor({ appLogo, version, adapterListener, isDark = true }: UIConfig) {
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
    const web3authIcon = images[`web3auth${this.isDark ? "-light" : ""}.svg`];
    const closeIcon = icons["close.svg"];
    const torusPower = images["torus-power.svg"];
    this.$modal = this.htmlToElement(`
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
                        <img src="${closeIcon}" alt="">
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
                        <img height="24" src="${web3authIcon}" alt="">
                    </div>
                </div>
                <div class="w3ajs-modal-loader w3a-modal__loader w3a-modal__loader--hidden">
                    <div class="w3a-modal__loader-content">
                        <div class="w3a-modal__loader-info">
                          <div class="w3ajs-modal-loader__spinner w3a-spinner">
                              <div class="w3a-spinner__body"></div>
                              <div class="w3a-spinner__cover"></div>
                              <div class="w3a-spinner__head"></div>
                          </div>
                          <div class="w3ajs-modal-loader__label w3a-spinner-label"></div>
                          <div class="w3ajs-modal-loader__message w3a-spinner-message" style="display: none"></div>
                          <button class="w3a-logout w3ajs-logout" style="display: none">
                              <h6 class="w3a-group__title">Logout</h6>
                          </button>
                        </div>
                        <div class="w3a-spinner-power">
                            <img src="${torusPower}" alt="">
                        </div>
                    </div>
                    <button class="w3a-header__button w3ajs-loader-close-btn">
                        <img src="${closeIcon}" alt="">
                    </button>
                </div>
            </div>
        </div>
    `);
    const $content = this.$modal.querySelector(".w3ajs-content");

    const $closeBtn = this.$modal.querySelector(".w3ajs-close-btn");

    const $loaderCloseBtn = this.$modal.querySelector(".w3ajs-loader-close-btn");

    const $torusWallet = this.getSocialLogins();
    const $torusWalletEmail = this.getSocialLoginsEmail();
    const $externalWallet = this.getExternalWallet();

    const $externalToggle = $externalWallet.querySelector(".w3ajs-external-toggle");
    const $externalToggleButton = $externalToggle?.querySelector(".w3ajs-external-toggle__button");
    const $externalBackButton = $externalWallet.querySelector(".w3ajs-external-back");
    const $externalContainer = $externalWallet.querySelector(".w3ajs-external-container");
    const $loaderLogout = this.$modal.querySelector(".w3ajs-logout") as HTMLButtonElement;

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

    $closeBtn.addEventListener("click", this.toggleModal);

    $loaderCloseBtn?.addEventListener("click", () => {
      if (this.state.connected) {
        this.toggleMessage("");
        this.toggleModal();
      } else {
        this.toggleMessage("");
      }
    });

    $loaderLogout?.addEventListener("click", () => {
      this.emit("DISCONNECT");
    });

    $content?.appendChild($torusWallet);
    $content?.appendChild($torusWalletEmail);
    $content?.appendChild($externalWallet);

    document.body.appendChild(this.$modal);
    this.state.initialized = true;
  }

  toggleModal = (): void => {
    const hideClass = "w3a-modal--hidden";
    const $inner = this.$modal.querySelector(".w3ajs-inner");

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

  addSocialLogins = (adapter: WALLET_ADAPTER_TYPE, adapterConfig: BaseAdapterConfig, loginMethods: Record<string, LoginMethodConfig>): void => {
    const $socialLogins = this.$modal.querySelector(".w3ajs-social-logins") as HTMLDivElement;
    const $adapterList = $socialLogins.querySelector(".w3ajs-socials-adapters") as HTMLDivElement;
    // const $adapterExpand = $socialLogins.querySelector(".w3ajs-socials-adapters__expand") as HTMLDivElement;

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
          if (email) this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter, loginParams: { loginProvider: method, loginHint: email } } as CommonLoginOptions);
        });
        return;
      } else if (method === "webauthn" || method === "jwt") {
        return;
      }
      this.hasSocialWallet = true;
      $socialLogins.classList.remove("w3a-group--social-hidden");
      const providerIcon = images[`login-${method}${this.isDark && hasLightIcons.includes(method) ? "-light" : ""}.svg`];
      const adapterButton = this.htmlToElement(`
            <li class="w3a-adapter-item">
                <button class="w3a-button w3a-button--icon">
                    <img class="w3a-button__image" src="${providerIcon}" alt="">
                </button>
            </li>          
        `);

      adapterButton.addEventListener("click", () => {
        this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter, loginParams: { loginProvider: method } as CommonLoginOptions });
      });

      // if ($adapterList.children.length < 5) {
      //   $adapterExpand.before(adapterButton);
      //   $adapterExpand.classList.add("w3a-adapter-item--hide");
      // } else if ($adapterList.children.length === 5) {
      //   $adapterExpand.after(adapterButton);
      //   $adapterExpand.classList.add("w3a-adapter-item--hide");
      // } else {
      //   $adapterExpand.after(adapterButton);
      //   $adapterExpand.classList.remove("w3a-adapter-item--hide");
      // }
      $adapterList.append(adapterButton);
    });
  };

  addWalletLogins = (adaptersConfig: Record<string, BaseAdapterConfig>, options?: { showExternalWallets: boolean }): void => {
    if (options.showExternalWallets) {
      this.showExternalWallets();
    }
    const expandIcon = icons["expand.svg"];
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
    const firstAdapter = adapterKeys.shift();
    const showMore = adapterKeys.length > 0;

    const firstAdapterIcon = images[`login-${firstAdapter}.svg`];

    // Add main adapter
    const mainAdapterSection = this.htmlToElement(`
      <div class="w3a-external-group">
        <div class="w3a-external-group__left">
            <button class="w3ajs-${firstAdapter} w3a-button ${showMore ? `w3a-button--left` : `w3a-button--left-alone`}">
                <img class="w3a-button__image"
                    src="${firstAdapterIcon}" alt="">
                <div>Sign in with ${firstAdapter}</div>
            </button>
        </div>
        ${
          showMore
            ? `<div>
                  <button class="w3a-button w3ajs-button-expand w3a-button--icon">
                      <img class="w3a-button__image" src="${expandIcon}" alt="">
                  </button>
              </div>`
            : ""
        }
      </div>
    `);
    const $mainAdapterButton = mainAdapterSection.querySelector(`.w3ajs-${firstAdapter}`) as HTMLDivElement;
    $mainAdapterButton.addEventListener("click", () => {
      this.emit(LOGIN_MODAL_EVENTS.LOGIN, { adapter: firstAdapter });
    });

    if (showMore) {
      const $adapterExpandBtn = mainAdapterSection.querySelector(".w3ajs-button-expand") as HTMLDivElement;

      $adapterExpandBtn.addEventListener("click", () => {
        $adapterExpandBtn.classList.toggle("w3a-button--rotate");
        $adapterList.classList.toggle("w3a-adapter-list--hidden");
      });
    }
    $adapterList.before(mainAdapterSection);

    adapterKeys.forEach((adapter) => {
      $externalWallet.classList.remove("w3a-group--ext-wallet-hidden");
      const providerIcon = images[`login-${adapter}.svg`];
      const adapterButton = this.htmlToElement(`
            <li class="w3a-adapter-item">
                <button class="w3a-button w3a-button--icon">
                    <img class="w3a-button__image" src="${providerIcon}" alt="">
                </button>
                <p class="w3a-adapter-item__label">${adapter}</p>
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

  private getSocialLogins(): HTMLDivElement {
    const expandIcon = icons[`expand${this.isDark ? "-light" : ""}.svg`];
    const $socialLogins = this.htmlToElement(`
        <div class="w3ajs-social-logins w3a-group w3a-group--social-hidden">
            <h6 class="w3a-group__title">CONTINUE WITH</h6>
            <ul class="w3a-adapter-list w3a-adapter-list--shrink w3ajs-socials-adapters"></ul>
            <button class="w3a-button-expand w3ajs-button-expand">
              <img class="w3a-button__image" src="${expandIcon}" alt="">
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
    const $socialEmail = this.htmlToElement(`
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
    const arrowLeftIcon = icons["circle-arrow-left.svg"];
    const $externalWallet = this.htmlToElement(`
        <div class="w3ajs-external-wallet w3a-group">
            <div class="w3a-external-toggle w3ajs-external-toggle">
                <h6 class="w3a-group__title">EXTERNAL WALLET</h6>
                <button class="w3a-button w3ajs-external-toggle__button">Connect with Wallet</button>
            </div>
            <div class="w3a-external-container w3a-external-container--hidden w3ajs-external-container">
                <button class="w3a-external-back w3ajs-external-back">
                    <img src="${arrowLeftIcon}" alt="">
                    <h6 class="w3a-group__title">Back</h6>
                </button>

                <h6 class="w3a-group__title">EXTERNAL WALLET</h6>
                <!-- Other Wallet -->
                <div class="w3a-external-loader w3ajs-external-loader">
                  <div class="w3a-spinner w3a-spinner--small">
                    <div class="w3a-spinner__body"></div>
                    <div class="w3a-spinner__cover"></div>
                    <div class="w3a-spinner__head"></div>
                  </div>
                </div>
                <ul class="w3a-adapter-list w3a-adapter-list--hidden w3ajs-wallet-adapters"></ul>
            </div>
        </div>
    `) as HTMLDivElement;

    return $externalWallet;
  };

  private toggleLoader(provider = "") {
    const $loader = this.$modal.querySelector(".w3ajs-modal-loader");
    const $loaderLabel = this.$modal.querySelector(".w3ajs-modal-loader__label") as HTMLDivElement;
    if (this.state.connecting) {
      $loader.classList.remove("w3a-modal__loader--hidden");
      $loaderLabel.style.display = "block";
      $loaderLabel.innerText = provider;
    } else {
      $loader.classList.add("w3a-modal__loader--hidden");
      $loaderLabel.style.display = "none";
      $loaderLabel.innerText = "";
    }
  }

  private toggleMessage(message: string, type = "") {
    const $loader = this.$modal.querySelector(".w3ajs-modal-loader");
    const $loaderSpinner = this.$modal.querySelector(".w3ajs-modal-loader__spinner") as HTMLDivElement;
    const $loaderLabel = this.$modal.querySelector(".w3ajs-modal-loader__label") as HTMLDivElement;
    const $loaderMessage = this.$modal.querySelector(".w3ajs-modal-loader__message") as HTMLDivElement;
    const $loaderClose = this.$modal.querySelector(".w3ajs-loader-close-btn") as HTMLDivElement;
    const $loaderLogout = this.$modal.querySelector(".w3ajs-logout") as HTMLButtonElement;

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

    if (type === BASE_WALLET_EVENTS.ERRORED) {
      $loaderMessage.classList.add("w3a-spinner-message--error");
    } else {
      $loaderMessage.classList.remove("w3a-spinner-message--error");
    }

    if (type === BASE_WALLET_EVENTS.CONNECTED) {
      $loaderLogout.style.display = "block";
    } else {
      $loaderLogout.style.display = "none";
    }
  }

  private htmlToElement = <T extends Element>(html: string): T => {
    const template = window.document.createElement("template");
    const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = trimmedHtml;
    return template.content.firstChild as T;
  };

  private subscribeCoreEvents(listener: SafeEventEmitter) {
    listener.on(BASE_WALLET_EVENTS.CONNECTING, (data) => {
      const provider = (data as CommonLoginOptions)?.loginProvider || "";
      this.state.connecting = true;
      this.state.connected = false;
      this.toggleLoader(provider);
    });
    listener.on(BASE_WALLET_EVENTS.CONNECTED, () => {
      this.state.connecting = false;
      if (!this.state.connected) {
        this.state.connected = true;
        this.toggleMessage("You are now connected to your wallet. Close the modal to go to the app", BASE_WALLET_EVENTS.CONNECTED);
      }
    });
    listener.on(BASE_WALLET_EVENTS.ERRORED, (data: WalletError) => {
      this.state.connecting = false;
      this.state.connected = false;
      if (data?.code && data.code >= 1000 && data.code < 2000) {
        this.state.errored = true;
        this.toggleMessage(`Error: ${data.message}`, BASE_WALLET_EVENTS.ERRORED);
      } else {
        this.toggleLoader();
      }
    });
    listener.on(BASE_WALLET_EVENTS.DISCONNECTED, () => {
      this.state.connecting = false;
      this.state.connected = false;
      this.toggleMessage("");
    });
  }
}
