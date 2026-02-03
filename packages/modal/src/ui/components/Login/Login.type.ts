import type { ExternalButton, ExternalWalletEventType, SocialLoginEventType } from "../../interfaces";

export interface LoginProps {
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
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
