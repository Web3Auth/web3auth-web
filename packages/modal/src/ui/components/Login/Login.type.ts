import { ExternalButton, LogoAlignmentType, SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface LoginProps {
  isModalVisible: boolean;
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  showExternalWalletCount: boolean;
  showInstalledExternalWallets: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  installedExternalWalletConfig: ExternalButton[];
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  totalExternalWallets: number;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  handleInstalledExternalWalletClick?: (params: { connector: string }) => void;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleSocialLoginHeight: () => void;
  logoAlignment?: LogoAlignmentType;
}
