import { SafeEventEmitter } from "@web3auth/auth";
import { WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

import { ExternalWalletEventType, SocialLoginEventType, StateEmitterEvents } from "../../interfaces";

export interface WidgetProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
}
