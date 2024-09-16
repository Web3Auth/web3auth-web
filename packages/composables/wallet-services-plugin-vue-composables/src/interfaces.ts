import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import type { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { Ref } from "vue";

export interface IBaseWalletServicesComposableContext {
  isPluginConnected: Ref<boolean>;
  showWalletConnectScanner(showWalletConnectParams?: BaseEmbedControllerState["showWalletConnect"]): Promise<void>;
  showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void>;
  showWalletUI(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void>;
}

export interface IWalletServicesContext extends IBaseWalletServicesComposableContext {
  plugin: Ref<WalletServicesPlugin | null>;
}
