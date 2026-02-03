import type { ExternalButton, ExternalWalletEventType, SocialLoginEventType } from "../../interfaces";

export interface LoginProps {
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  installedExternalWalletConfig: ExternalButton[];
  totalExternalWallets: number;
  remainingUndisplayedWallets: number;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleSocialLoginHeight: () => void;
}
