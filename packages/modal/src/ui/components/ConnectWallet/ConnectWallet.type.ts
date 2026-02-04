import type { BaseConnectorConfig, ChainNamespaceType } from "@web3auth/no-modal";

import type { ExternalButton } from "../../interfaces";

export interface ConnectWalletProps {
  isDark: boolean;
  config: Record<string, BaseConnectorConfig>;
  walletConnectUri: string | undefined;
  metamaskConnectUri: string | undefined;
  allRegistryButtons: ExternalButton[];
  customConnectorButtons: ExternalButton[];
  connectorVisibilityMap: Record<string, boolean>;
  isExternalWalletModeOnly: boolean;
  onBackClick?: (flag: boolean) => void;
  handleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
  handleWalletDetailsHeight: () => void;
  disableBackButton?: boolean;
}
