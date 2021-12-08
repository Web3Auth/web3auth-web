import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { BASE_WALLET_EVENTS, BaseAdapterConfig, CommonLoginOptions, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";

import { icons, images } from "../assets";
import { LOGIN_MODAL_EVENTS, UIConfig } from "./interfaces";

const hasLightIcons = ["apple", "github"];
export default class LoginModal extends SafeEventEmitter {
  public $modal!: HTMLDivElement;

  private appLogo: string;

  private version: string;

  private isDark: boolean;

  private state = {
    initialized: false,
    connected: false,
    connecting: false,
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
    this.$modal = this.htmlToElement(`
        <div class="w3a-modal w3a-modal--hidden${this.isDark ? "" : " w3a-modal--light"}">
            <div class="w3a-modal__inner">
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
            </div>
        </div>
    `);
    const $content = this.$modal.querySelector(".w3ajs-content");

    const $closeBtn = this.$modal.querySelector(".w3ajs-close-btn");

    const $torusWallet = this.getSocialLogins();
    const $torusWalletEmail = this.getSocialLoginsEmail();
    const $externalWallet = this.getExternalWallet();

    const $externalToggle = $externalWallet.querySelector(".w3ajs-external-toggle");
    const $externalToggleButton = $externalToggle?.querySelector(".w3ajs-external-toggle__button");
    const $externalBackButton = $externalWallet.querySelector(".w3ajs-external-back");
    const $externalContainer = $externalWallet.querySelector(".w3ajs-external-container");

    $closeBtn.addEventListener("click", this.toggleModal);

    $externalToggleButton?.addEventListener("click", () => {
      $externalToggle?.classList.toggle("w3a-external-toggle--hidden");
      $externalContainer?.classList.toggle("w3a-external-container--hidden");
      $torusWallet.classList.toggle("w3a-group--hidden");
      $torusWalletEmail.classList.toggle("w3a-group--hidden");
    });

    $externalBackButton?.addEventListener("click", () => {
      $externalToggle?.classList.toggle("w3a-external-toggle--hidden");
      $externalContainer?.classList.toggle("w3a-external-container--hidden");
      $torusWallet.classList.toggle("w3a-group--hidden");
      $torusWalletEmail.classList.toggle("w3a-group--hidden");
    });

    $content?.appendChild($torusWallet);
    $content?.appendChild($torusWalletEmail);
    $content?.appendChild($externalWallet);

    document.body.appendChild(this.$modal);
    this.state.initialized = true;
  }

  toggleModal = (): void => {
    const hideClass = "w3a-modal--hidden";
    this.$modal.classList.toggle(hideClass);
  };

  addSocialLogins = (adapter: WALLET_ADAPTER_TYPE, adapterConfig: BaseAdapterConfig, loginMethods: Record<string, LoginMethodConfig>): void => {
    const $adapterList = this.$modal.querySelector(".w3ajs-socials-adapters") as HTMLDivElement;
    const $adapterExpand = $adapterList.querySelector(".w3ajs-socials-adapters__expand") as HTMLDivElement;
    Object.keys(loginMethods)
      .reverse()
      .forEach((method: string) => {
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

        if ($adapterList.children.length < 5) {
          $adapterExpand.before(adapterButton);
          $adapterExpand.classList.add("w3a-adapter-item--hide");
        } else if ($adapterList.children.length === 5) {
          $adapterExpand.after(adapterButton);
          $adapterExpand.classList.add("w3a-adapter-item--hide");
        } else {
          $adapterExpand.after(adapterButton);
          $adapterExpand.classList.remove("w3a-adapter-item--hide");
        }
      });
  };

  addWalletLogins = (adaptersConfig: Record<string, BaseAdapterConfig>): void => {
    const adapterList = this.$modal.querySelector(".w3ajs-wallet-adapters") as HTMLDivElement;
    Object.keys(adaptersConfig).forEach((adapter) => {
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

      adapterList.appendChild(adapterButton);
    });
  };

  private getSocialLogins(): HTMLDivElement {
    const expandIcon = icons[`expand${this.isDark ? "-light" : ""}.svg`];
    const $socialLogins = this.htmlToElement(`
        <div class="w3a-group">
            <h6 class="w3a-group__title">CONTINUE WITH</h6>
            <ul class="w3a-adapter-list w3a-adapter-list--shrink w3ajs-socials-adapters">
              <li class="w3a-adapter-item w3a-adapter-item--hide w3ajs-socials-adapters__expand">
                  <button class="w3a-button w3ajs-button-expand w3a-button--icon">
                      <img class="w3a-button__image" src="${expandIcon}" alt="">
                  </button>
              </li>   
            </ul>
        </div>
    `) as HTMLDivElement;

    const $adapterList = $socialLogins.querySelector(".w3ajs-socials-adapters") as HTMLDivElement;
    const $adapterExpandBtn = $adapterList.querySelector(".w3ajs-button-expand") as HTMLDivElement;
    $adapterExpandBtn.addEventListener("click", () => {
      $adapterList.classList.toggle("w3a-adapter-list--shrink");
      $adapterExpandBtn.classList.toggle("w3a-button--rotate");
    });

    return $socialLogins;
  }

  private getSocialLoginsEmail = (): HTMLDivElement => {
    const $socialEmail = this.htmlToElement(`
        <div class="w3a-group">
            <h6 class="w3a-group__title">EMAIL</h6>
        </div>
    `) as HTMLDivElement;

    const $emailForm = this.htmlToElement(`
      <form>
          <input class="w3a-text-field" type="email" name="email" required placeholder="Email">
          <button class="w3a-button" type="submit">Continue with Email</button>
      </form>
    `) as HTMLFormElement;

    $emailForm.addEventListener("submit", (event: Event) => {
      event.preventDefault();
      const data = new FormData(event.target as HTMLFormElement);
      const email = data.get("email");
      if (email) this.emit(LOGIN_MODAL_EVENTS.LOGIN, { loginProvider: "email_passwordless", loginHint: email } as CommonLoginOptions);
    });
    $socialEmail.appendChild($emailForm);
    return $socialEmail;
  };

  private getExternalWallet = (): HTMLDivElement => {
    const torusImage = images[`login-torus.svg`];
    const arrowLeftIcon = icons["circle-arrow-left.svg"];
    const expandIcon = icons["expand.svg"];
    const $externalWallet = this.htmlToElement(`
        <div class="w3a-group">
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
                <div class="w3a-external-group">
                    <div class="w3a-external-group__left">
                        <button class="w3a-button w3a-button--left">
                            <img class="w3a-button__image"
                                src="${torusImage}" alt="">
                            Sign in with Torus
                        </button>
                    </div>
                    <div>
                        <button class="w3a-button w3ajs-button-expand w3a-button--icon">
                            <img class="w3a-button__image" src="${expandIcon}" alt="">
                        </button>
                    </div>
                </div>
                <!-- Other Wallet -->
                <ul class="w3a-adapter-list w3a-adapter-list--hidden w3ajs-wallet-adapters"></ul>
            </div>
        </div>
    `) as HTMLDivElement;

    const $adapterExpandBtn = $externalWallet.querySelector(".w3ajs-button-expand") as HTMLDivElement;
    const $adapterList = $externalWallet.querySelector(".w3ajs-wallet-adapters") as HTMLDivElement;

    $adapterExpandBtn.addEventListener("click", () => {
      $adapterExpandBtn.classList.toggle("w3a-button--rotate");
      $adapterList.classList.toggle("w3a-adapter-list--hidden");
    });
    return $externalWallet;
  };

  private htmlToElement = <T extends Element>(html: string): T => {
    const template = window.document.createElement("template");
    const trimmedHtml = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = trimmedHtml;
    return template.content.firstChild as T;
  };

  private subscribeCoreEvents(listener: SafeEventEmitter) {
    listener.on(BASE_WALLET_EVENTS.CONNECTING, () => {
      this.state.connecting = true;
      this.state.connected = false;
    });
    listener.on(BASE_WALLET_EVENTS.CONNECTED, () => {
      this.state.connecting = false;
      this.state.connected = true;
    });
    listener.on(BASE_WALLET_EVENTS.ERRORED, () => {
      this.state.errored = true;
    });
    listener.on(BASE_WALLET_EVENTS.DISCONNECTED, () => {
      this.state.connecting = false;
      this.state.connected = false;
    });
  }
}
