import { WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";

import { SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface LoginProps {
  web3authClientId: string;
  web3authNetwork: WEB3AUTH_NETWORK_TYPE;
  isModalVisible: boolean;
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  totalExternalWallets: number;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleSocialLoginHeight: () => void;
}
