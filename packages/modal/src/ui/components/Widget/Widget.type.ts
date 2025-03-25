import { SafeEventEmitter } from "@web3auth/auth";
import { ChainNamespaceType, WalletRegistry } from "@web3auth/no-modal";

import { ExternalWalletEventType, SocialLoginEventType, StateEmitterEvents, WidgetType } from "../../interfaces";

export interface WidgetProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  appLogo?: string;
  appName?: string;
  chainNamespace: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
  widget?: WidgetType;
}
