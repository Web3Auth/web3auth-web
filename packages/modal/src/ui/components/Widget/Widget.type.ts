import { SafeEventEmitter } from "@web3auth/auth";
import { ChainNamespaceType, WalletRegistry } from "@web3auth/no-modal";

import { browser, ExternalWalletEventType, os, platform, SocialLoginEventType, StateEmitterEvents, UIConfig } from "../../interfaces";

export interface WidgetProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  appLogo?: string;
  appName?: string;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  uiConfig: UIConfig;
  deviceDetails: { platform: platform; browser: browser; os: os };
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
}
