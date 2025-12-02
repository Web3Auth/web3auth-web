import type { ChainNamespaceType, WALLET_CONNECTOR_TYPE, WalletRegistry } from "@web3auth/no-modal";

import { browser, ModalState, os, platform, SocialLoginEventType, SocialLoginsConfig, UIConfig } from "../../interfaces";

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
  deviceDetails: { platform: platform; browser: browser; os: os };
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  preHandleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
  setModalState: (state: ModalState) => void;
  onCloseLoader: () => void;
  isConnectAndSignAuthenticationMode: boolean;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
}
