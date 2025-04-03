import { browser, ExternalButton, os, platform } from "../../../interfaces";

export interface ConnectWalletListProps {
  externalButtons: ExternalButton[];
  isLoading: boolean;
  totalExternalWalletsCount: number;
  initialWalletCount: number;
  isDark: boolean;
  deviceDetails: { platform: platform; browser: browser; os: os };
  walletConnectUri: string;
  handleWalletClick: (button: ExternalButton) => void;
  handleMoreWallets: () => void;
}

export type WalletsFoundProps = Pick<
  ConnectWalletListProps,
  "externalButtons" | "isLoading" | "handleWalletClick" | "deviceDetails" | "walletConnectUri"
>;

export type MoreWalletsButtonProps = Pick<
  ConnectWalletListProps,
  "totalExternalWalletsCount" | "initialWalletCount" | "handleMoreWallets" | "isLoading" | "isDark"
>;
