import type { ChainNamespaceType, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

import { SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface RootProps {
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  showExternalWalletPage: boolean;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  preHandleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
  onCloseLoader: () => void;
  isConnectAndSignAuthenticationMode: boolean;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
}
