import { EVM_CONNECTORS, type WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

import { ConnectorsModalConfig, ModalConfig } from "./interface";

export const version = process.env.WEB3AUTH_VERSION;

export const defaultConnectorsModalConfig: ConnectorsModalConfig = {
  hideWalletDiscovery: false,
  connectors: {
    [EVM_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
    },
  } as Record<WALLET_CONNECTOR_TYPE, ModalConfig>,
};
