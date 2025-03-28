import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletHeaderProps {
  onBackClick: () => void;
  currentPage: string;
  selectedButton: ExternalButton;
}
