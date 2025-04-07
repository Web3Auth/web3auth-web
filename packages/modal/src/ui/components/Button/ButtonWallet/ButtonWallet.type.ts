import { browser, ButtonRadiusType, ExternalButton, os, platform } from "../../../interfaces";

export interface ButtonWalletProps {
  label: string;
  onClick?: () => void;
  button?: ExternalButton;
  deviceDetails?: { platform: platform; os: os; browser: browser };
  walletConnectUri: string | undefined;
  buttonRadius?: ButtonRadiusType;
}
