import type { ChainNamespaceType } from "@web3auth/no-modal";

import type { ExternalButton } from "../../interfaces";

export interface ConnectWalletProps {
  isDark: boolean;
  allRegistryButtons: ExternalButton[];
  customConnectorButtons: ExternalButton[];
  connectorVisibilityMap: Record<string, boolean>;
  onBackClick?: (flag: boolean) => void;
  handleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
  handleWalletDetailsHeight: () => void;
  disableBackButton?: boolean;
  isExternalWalletModeOnly?: boolean;
}
