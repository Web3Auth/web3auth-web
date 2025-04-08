import type { ChainNamespaceType, WalletRegistry } from "@web3auth/no-modal";

import { ModalState, SocialLoginEventType, SocialLoginsConfig, UIConfig } from "../../interfaces";

export interface RootProps {
  appLogo?: string;
  appName?: string;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  showExternalWalletPage: boolean;
  modalState: ModalState;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  uiConfig: UIConfig;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  preHandleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
  setModalState: (state: ModalState) => void;
  onCloseLoader: () => void;
}
