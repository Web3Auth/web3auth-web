import { EVM_CONNECTORS } from "@web3auth/no-modal";

import { ConnectorsModalConfig } from "./interface";

export const defaultConnectorsModalConfig: ConnectorsModalConfig = {
  hideWalletDiscovery: false,
  connectors: {
    [EVM_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const walletRegistryUrl = "https://assets.web3auth.io/v1/wallet-registry.json";
