import { type ChainNamespaceType } from "@web3auth/no-modal";

import { ExternalButton } from "../../../interfaces";

export interface ConnectWalletChainNamespaceSelectProps {
  selectedButton: ExternalButton;
  handleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
}
