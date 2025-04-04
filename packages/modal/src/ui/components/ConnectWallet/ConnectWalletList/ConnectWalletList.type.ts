import { browser, ButtonRadiusType, ExternalButton, os, platform } from "../../../interfaces";

export interface ConnectWalletListProps {
  externalButtons: ExternalButton[];
  isLoading: boolean;
  totalExternalWallets: number;
  initialWalletCount: number;
  handleWalletClick: (button: ExternalButton) => void;
  handleMoreWallets: () => void;
  isDark: boolean;
  deviceDetails: { platform: platform; browser: browser; os: os };
  walletConnectUri: string;
  buttonRadius: ButtonRadiusType;
}

export type WalletsFoundProps = Pick<
  ConnectWalletListProps,
  "externalButtons" | "isLoading" | "handleWalletClick" | "deviceDetails" | "walletConnectUri" | "buttonRadius"
>;

export type MoreWalletsButtonProps = Pick<
  ConnectWalletListProps,
  "totalExternalWallets" | "initialWalletCount" | "handleMoreWallets" | "isLoading" | "isDark" | "buttonRadius"
>;
