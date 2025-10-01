import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletHeaderProps {
  disableBackButton?: boolean;
  onBackClick: () => void;
  currentPage: string;
  selectedButton: ExternalButton;
}
