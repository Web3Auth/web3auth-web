import { SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface LoginProps {
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  totalExternalWallets: number;
  handleSocialLoginHeight: () => void;
}
