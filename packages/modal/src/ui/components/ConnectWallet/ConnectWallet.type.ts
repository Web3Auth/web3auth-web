import type { BaseConnectorConfig, ChainNamespaceType, WalletRegistry } from "@web3auth/no-modal";

import type { browser, ButtonRadiusType, ExternalButton, os, platform } from "../../interfaces";

export interface ConnectWalletProps {
  isDark: boolean;
  config: Record<string, BaseConnectorConfig>;
  walletConnectUri: string | undefined;
  walletRegistry?: WalletRegistry;
  allExternalButtons: ExternalButton[];
  totalExternalWallets: number;
  customAdapterButtons: ExternalButton[];
  adapterVisibilityMap: Record<string, boolean>;
  deviceDetails: { platform: platform; browser: browser; os: os };
  chainNamespace: ChainNamespaceType[];
  onBackClick?: (flag: boolean) => void;
  handleExternalWalletClick: (params: { connector: string; chainNamespace?: ChainNamespaceType }) => void;
  handleWalletDetailsHeight: () => void;
  buttonRadius: ButtonRadiusType;
}
