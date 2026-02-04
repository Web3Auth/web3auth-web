import type { ExternalButton, ExternalWalletEventType, SocialLoginEventType } from "../../interfaces";

export interface LoginProps {
  installedExternalWalletConfig: ExternalButton[];
  totalExternalWallets: number;
  remainingUndisplayedWallets: number;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleSocialLoginHeight: () => void;
}
