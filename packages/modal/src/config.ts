import { CHAIN_NAMESPACES, EVM_CONNECTORS, SOLANA_CONNECTORS } from "@web3auth/no-modal";

import { ConnectorsModalConfig } from "./interface";

export const defaultSolanaDappModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  connectors: {
    [SOLANA_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultEvmDappModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  connectors: {
    [EVM_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [EVM_CONNECTORS.WALLET_CONNECT_V2]: {
      label: "Wallet Connect",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultSolanaWalletModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  connectors: {
    [SOLANA_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultEvmWalletModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  connectors: {
    [EVM_CONNECTORS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultOtherModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
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
