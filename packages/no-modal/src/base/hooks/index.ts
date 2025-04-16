import { BaseEmbedControllerState } from "@toruslabs/base-controllers";

import { CONNECTOR_STATUS_TYPE, IProvider } from "../connector";
import { IPlugin } from "../plugin";

export interface IBaseWeb3AuthHookContext {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: unknown;
  isConnected: boolean;
  isMFAEnabled: boolean;
  provider: IProvider | null;
  status: CONNECTOR_STATUS_TYPE | null;
  getPlugin(pluginName: string): IPlugin | null;
}

export interface IBaseWalletServicesHookContext {
  isPluginConnected: boolean;
  showWalletConnectScanner(showWalletConnectParams?: BaseEmbedControllerState["showWalletConnect"]): Promise<void>;
  showSwap(showSwapParams?: BaseEmbedControllerState["showSwap"]): Promise<void>;
  showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void>;
  showWalletUI(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void>;
}
