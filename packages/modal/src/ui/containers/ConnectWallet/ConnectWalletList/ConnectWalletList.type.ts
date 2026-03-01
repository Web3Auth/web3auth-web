import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletListProps {
  externalButtons: ExternalButton[];
  isLoading: boolean;
  totalExternalWalletsCount: number;
  initialWalletCount: number;
  isDark: boolean;
  walletConnectUri: string;
  handleWalletClick: (button: ExternalButton) => void;
  handleMoreWallets: () => void;
  isShowAllWallets: boolean;
}

export type WalletsFoundProps = Pick<ConnectWalletListProps, "externalButtons" | "isLoading" | "handleWalletClick" | "walletConnectUri">;

export type MoreWalletsButtonProps = Pick<
  ConnectWalletListProps,
  "totalExternalWalletsCount" | "initialWalletCount" | "handleMoreWallets" | "isLoading" | "isDark"
>;
