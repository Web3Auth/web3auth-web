import { type ExternalButton } from "../../../interfaces";

export interface ConnectWalletQrCodeProps {
  qrCodeValue: string;
  isDark: boolean;
  selectedButton: ExternalButton;
  logoImage?: string;
  primaryColor?: string;
}
