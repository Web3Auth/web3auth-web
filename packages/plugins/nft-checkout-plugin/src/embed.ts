import { randomId } from "@toruslabs/base-controllers";
import { THEME_MODES, WhiteLabelData } from "@web3auth/auth";
import log from "loglevel";

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

// preload for iframe doesn't work https://bugs.chromium.org/p/chromium/issues/detail?id=593267
(async function preLoadIframe() {
  try {
    if (typeof document === "undefined") return;
    const nftCheckoutIframeHtml = document.createElement("link");
    const nftCheckoutUrl = NFT_CHECKOUT_URLS.testing; // TODO: use production by default once we have it
    nftCheckoutIframeHtml.href = `${nftCheckoutUrl}`;
    nftCheckoutIframeHtml.crossOrigin = "anonymous";
    nftCheckoutIframeHtml.type = "text/html";
    nftCheckoutIframeHtml.rel = "prefetch";
    if (nftCheckoutIframeHtml.relList && nftCheckoutIframeHtml.relList.supports) {
      if (nftCheckoutIframeHtml.relList.supports("prefetch")) {
        document.head.appendChild(nftCheckoutIframeHtml);
      }
    }
  } catch (error) {
    log.warn(error);
  }
})();

export class NFTCheckoutEmbed {
  web3AuthClientId: string;

  isInitialized: boolean;

  private modalZIndex: number;

  private buildEnv: NFT_CHECKOUT_BUILD_ENV_TYPE;

  private readonly embedNonce = randomId();

  constructor({ modalZIndex = 99999, web3AuthClientId }: { modalZIndex?: number; web3AuthClientId: string }) {
    this.isInitialized = false;
    this.modalZIndex = modalZIndex;
    this.web3AuthClientId = web3AuthClientId;
  }

  public async init(params?: { buildEnv?: NFT_CHECKOUT_BUILD_ENV_TYPE; whiteLabel?: WhiteLabelData }): Promise<void> {
    if (this.isInitialized) throw new Error("Already initialized");
    if (this.getIframe()) throw new Error("Already initialized NFT Checkout iframe");
    const {
      buildEnv = NFT_CHECKOUT_BUILD_ENV.TESTING, // TODO: use production by default once we have it
      whiteLabel,
    } = params || {};
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
        sandbox="allow-popups allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups-to-escape-sandbox"
        src="${nftCheckoutIframeUrl.href}"
        style="display: none; position: fixed; top: 0; right: 0; width: 100%;
        height: 100%; border: none; border-radius: 0; z-index: ${this.modalZIndex.toString()};
        color-scheme: ${colorScheme}"
        allow="clipboard-write"
      ></iframe>`
    );

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
                web3AuthClientId: this.web3AuthClientId,
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

  public show({ receiverAddress, contractId }: { receiverAddress?: string; contractId: string }): void {
    if (!this.isInitialized) throw new Error("Call init() first");
    const nftCheckoutIframe = this.getIframe();
    if (!nftCheckoutIframe) throw new Error("Iframe is not initialized");

    // send message to iframe
    const nftCheckoutOrigin = new URL(NFT_CHECKOUT_URLS[this.buildEnv]).origin;
    nftCheckoutIframe.contentWindow.postMessage(
      {
        type: MESSAGE_SHOW_NFT_CHECKOUT,
        contractId,
        receiverAddress,
      },
      nftCheckoutOrigin
    );
    // show iframe
    nftCheckoutIframe.style.display = "block";
  }

  public hide(): void {
    if (!this.isInitialized) throw new Error("Call init() first");
    const nftCheckoutIframe = this.getIframe();
    if (!nftCheckoutIframe) throw new Error("Iframe is not initialized");
    // hide iframe
    nftCheckoutIframe.style.display = "none";
  }

  public cleanup(): void {
    const nftCheckoutIframe = this.getIframe();
    if (nftCheckoutIframe) nftCheckoutIframe.remove();
  }

  private getIframe(): HTMLIFrameElement | null {
    function isElement(element: unknown) {
      return element instanceof Element || element instanceof Document;
    }
    const nftCheckoutIframe = window.document.getElementById(`nftCheckoutIframe-${this.embedNonce}`);
    if (!isElement(nftCheckoutIframe)) return null;
    return nftCheckoutIframe as HTMLIFrameElement;
  }
}
