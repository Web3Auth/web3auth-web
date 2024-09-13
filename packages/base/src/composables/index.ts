import { AuthUserInfo, LoginParams } from "@web3auth/auth";
import { Ref } from "vue";

import { ADAPTER_STATUS_TYPE, IProvider, UserAuthInfo } from "../adapter";
import { CustomChainConfig } from "../chain/IChainInterface";
import { IPlugin } from "../plugin";

export interface IBaseWeb3AuthComposableContext {
  isConnecting: Ref<boolean>;
  connectError: Ref<Error | null>;
  isConnected: Ref<boolean>;
  provider: Ref<IProvider | null>;
  userInfo: Ref<Partial<AuthUserInfo> | null>;
  isMFAEnabled: Ref<boolean>;
  isInitializing: Ref<boolean>;
  initError: Ref<Error | null>;
  isInitialized: Ref<boolean>;
  status: Ref<ADAPTER_STATUS_TYPE | null>;
  enableMFA(params?: LoginParams): Promise<void>;
  logout(params?: { cleanup: boolean }): Promise<void>;
  addAndSwitchChain(chainConfig: CustomChainConfig): Promise<void>;
  addPlugin(plugin: IPlugin): void;
  getPlugin(pluginName: string): IPlugin | null;
  authenticateUser(): Promise<UserAuthInfo>;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
}

// export interface IBaseWalletServicesComposablesContext {
//   isPluginConnected: boolean;
//   showWalletConnectScanner(showWalletConnectParams?: BaseEmbedControllerState["showWalletConnect"]): Promise<void>;
//   showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void>;
//   showWalletUI(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void>;
// }
