import { ChainNamespaceType } from "@web3auth/no-modal";

import { RootContextType } from "../../../context/RootContext";
import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletQrCodeProps extends RootContextType {
  walletConnectUri: string;
  isDark: boolean;
  selectedButton: ExternalButton;
  logoImage?: string;
  primaryColor?: string;
  handleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
}

export type SelectWalletChainNamespaceProps = Pick<ConnectWalletQrCodeProps, "handleExternalWalletClick" | "selectedButton">;
