import { randomId } from "@toruslabs/base-controllers";
import { THEME_MODES, WhiteLabelData } from "@web3auth/auth";

import {
  MESSAGE_HIDE_NFT_CHECKOUT,
  MESSAGE_INIT,
  MESSAGE_SETUP_COMPLETE,
  MESSAGE_SHOW_NFT_CHECKOUT,
  NFT_CHECKOUT_BUILD_ENV,
  NFT_CHECKOUT_BUILD_ENV_TYPE,
  NFT_CHECKOUT_URLS,
} from "./enums";
import { getTheme, htmlToElement } from "./utils";

export class NFTCheckoutEmbed {
  private isInitialized: boolean;

  private modalZIndex: number;

  private contractId: string;

  private apiKey: string;

  private buildEnv: NFT_CHECKOUT_BUILD_ENV_TYPE;

  private readonly embedNonce = randomId();

  private iframe: HTMLIFrameElement | null = null;

  constructor({ modalZIndex, contractId, apiKey }: { modalZIndex: number; contractId: string; apiKey: string }) {
    this.isInitialized = false;
    this.modalZIndex = modalZIndex;
    this.contractId = contractId;
    this.apiKey = apiKey;
  }

  public async init({
    buildEnv = NFT_CHECKOUT_BUILD_ENV.PRODUCTION,
    whiteLabel,
  }: {
    buildEnv?: NFT_CHECKOUT_BUILD_ENV_TYPE;
    whiteLabel?: WhiteLabelData;
  }): Promise<void> {
    if (this.isInitialized) throw new Error("Already initialized");
    this.buildEnv = buildEnv;

    // construct nft checkout url
    const nftCheckoutIframeUrl = new URL(NFT_CHECKOUT_URLS[this.buildEnv]);
    const hashParams = new URLSearchParams();
    hashParams.append("origin", window.location.origin);
    nftCheckoutIframeUrl.hash = hashParams.toString();

    // create iframe
    const colorScheme = getTheme(whiteLabel?.mode || THEME_MODES.light);
    const nftCheckoutIframe = htmlToElement<HTMLIFrameElement>(
      `<iframe
        id="nftCheckoutIframe-${this.embedNonce}"
        class="nftCheckoutIframe-${this.embedNonce}"
        sandbox="allow-popups allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
        src="${nftCheckoutIframeUrl.href}"
        style="display: none; position: fixed; top: 0; right: 0; width: 100%;
        height: 100%; border: none; border-radius: 0; z-index: ${this.modalZIndex.toString()};
        color-scheme: ${colorScheme}"
        allow="clipboard-write"
      ></iframe>`
    );
    this.iframe = nftCheckoutIframe;

    return new Promise<void>((resolve, reject) => {
      try {
        window.document.body.appendChild(nftCheckoutIframe);
        const handleMessage = async (ev: MessageEvent) => {
          if (ev.origin !== nftCheckoutIframeUrl.origin) return;
          if (ev.data.type === MESSAGE_SETUP_COMPLETE) {
            // send init params here
            nftCheckoutIframe.contentWindow.postMessage(
              {
                type: MESSAGE_INIT,
                apiKey: this.apiKey,
                contractId: this.contractId,
                whiteLabel,
              },
              nftCheckoutIframeUrl.origin
            );
            this.isInitialized = true;
            resolve();
          } else if (ev.data.type === MESSAGE_HIDE_NFT_CHECKOUT) {
            this.hide();
          }
        };
        window.addEventListener("message", handleMessage);
      } catch (error) {
        reject(error);
      }
    });
  }

  public show({ receiverAddress }: { receiverAddress?: string }): void {
    if (!this.isInitialized) throw new Error("Call init() first");
    if (!this.iframe) throw new Error("Iframe is not initialized");

    // send message to iframe
    const nftCheckoutOrigin = new URL(NFT_CHECKOUT_URLS[this.buildEnv]).origin;
    this.iframe.contentWindow.postMessage(
      {
        type: MESSAGE_SHOW_NFT_CHECKOUT,
        receiverAddress,
      },
      nftCheckoutOrigin
    );
    // show iframe
    this.iframe.style.display = "block";
  }

  public hide(): void {
    if (!this.isInitialized) throw new Error("Call init() first");
    if (!this.iframe) throw new Error("Iframe is not initialized");

    // hide iframe
    this.iframe.style.display = "none";
  }

  public cleanup(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }
}
