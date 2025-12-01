import { browser, ButtonRadiusType, ExternalButton, os, platform } from "../../../interfaces";

export interface ConnectWalletListProps {
  externalButtons: ExternalButton[];
  isLoading: boolean;
  totalExternalWalletsCount: number;
  initialWalletCount: number;
  isDark: boolean;
  deviceDetails: { platform: platform; browser: browser; os: os };
  walletConnectUri: string;
  buttonRadius: ButtonRadiusType;
  handleWalletClick: (button: ExternalButton) => void;
  handleMoreWallets: () => void;
  isShowAllWallets: boolean;
}

export type WalletsFoundProps = Pick<
  ConnectWalletListProps,
  "externalButtons" | "isLoading" | "handleWalletClick" | "deviceDetails" | "walletConnectUri" | "buttonRadius"
>;

export type MoreWalletsButtonProps = Pick<
  ConnectWalletListProps,
  "totalExternalWalletsCount" | "initialWalletCount" | "handleMoreWallets" | "isLoading" | "isDark" | "buttonRadius"
>;
