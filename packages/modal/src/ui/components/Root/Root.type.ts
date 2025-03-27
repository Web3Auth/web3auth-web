import { ChainNamespaceType, WalletRegistry } from "@web3auth/no-modal";

import { ModalState, SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface RootProps {
  appLogo?: string;
  appName?: string;
  chainNamespace: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  showExternalWalletPage: boolean;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  modalState: ModalState;
  preHandleExternalWalletClick: (params: { connector: string }) => void;
  setModalState: (state: ModalState) => void;
  onCloseLoader: () => void;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
}
