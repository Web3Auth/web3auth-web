import { BaseConnectorConfig, WalletRegistry } from "@web3auth/no-modal";

import { browser, ExternalButton, os, platform } from "../../interfaces";

export interface ConnectWalletProps {
  isDark: boolean;
  onBackClick?: (flag: boolean) => void;
  handleExternalWalletClick: (params: { connector: string }) => void;
  config: Record<string, BaseConnectorConfig>;
  walletConnectUri: string | undefined;
  walletRegistry?: WalletRegistry;
  allExternalButtons: ExternalButton[];
  totalExternalWallets: number;
  customAdapterButtons: ExternalButton[];
  adapterVisibilityMap: Record<string, boolean>;
  deviceDetails: { platform: platform; browser: browser; os: os };
  handleWalletDetailsHeight: () => void;
}
