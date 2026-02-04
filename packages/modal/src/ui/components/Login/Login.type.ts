import { BUILD_ENV_TYPE, WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";

import type { ExternalButton, ExternalWalletEventType, SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface LoginProps {
  web3authClientId: string;
  web3authNetwork: WEB3AUTH_NETWORK_TYPE;
  authBuildEnv: BUILD_ENV_TYPE;
  isModalVisible: boolean;
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  installedExternalWalletConfig: ExternalButton[];
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  totalExternalWallets: number;
  remainingUndisplayedWallets: number;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleSocialLoginHeight: () => void;
}
