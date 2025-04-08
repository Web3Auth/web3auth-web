import { RootContextType } from "../../../context/RootContext";
import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletQrCodeProps extends RootContextType {
  walletConnectUri: string;
  isDark: boolean;
  selectedButton: ExternalButton;
  logoImage?: string;
  primaryColor?: string;
}
