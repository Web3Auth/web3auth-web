import { type ChainNamespaceType } from "@web3auth/no-modal";

import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletChainNamespaceSelectProps {
  isDark: boolean;
  wallet: ExternalButton;
  handleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
}
