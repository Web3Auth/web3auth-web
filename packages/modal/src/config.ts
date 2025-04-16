import { EVM_CONNECTORS, type WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

import { ConnectorsModalConfig, ModalConfig } from "./interface";

export const defaultConnectorsModalConfig: ConnectorsModalConfig = {
  hideWalletDiscovery: false,
  connectors: {
    [EVM_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
    },
  } as Record<WALLET_CONNECTOR_TYPE, ModalConfig>,
};

export const walletRegistryUrl = "https://assets.web3auth.io/v1/wallet-registry.json";
