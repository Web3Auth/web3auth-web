import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletQrCodeProps {
  walletConnectUri: string;
  isDark: boolean;
  selectedButton: ExternalButton;
  setBodyState: (state: { showWalletDetails: boolean; walletDetails: ExternalButton }) => void;
  bodyState: { showWalletDetails: boolean; walletDetails: ExternalButton };
  logoImage?: string;
  primaryColor?: string;
}
