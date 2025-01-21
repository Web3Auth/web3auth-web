import type { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import type { Ref } from "vue";

import type { WalletServicesPlugin } from "@/core/wallet-services-plugin";

export interface IBaseWalletServicesComposableContext {
  isPluginConnected: Ref<boolean>;
  showWalletConnectScanner(showWalletConnectParams?: BaseEmbedControllerState["showWalletConnect"]): Promise<void>;
  showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void>;
  showWalletUI(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void>;
  showSwap(showSwapParams?: BaseEmbedControllerState["showSwap"]): Promise<void>;
}

export interface IWalletServicesContext extends IBaseWalletServicesComposableContext {
  plugin: Ref<WalletServicesPlugin | null>;
}
