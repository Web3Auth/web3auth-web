import { CHAIN_NAMESPACES, EVM_CONNECTORS, SOLANA_CONNECTORS } from "@web3auth/base";

import { ConnectorsModalConfig } from "./interface";

export const defaultSolanaDappModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  connectors: {
    [SOLANA_CONNECTORS.TORUS_SOLANA]: {
      label: "Torus Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [SOLANA_CONNECTORS.SOCIAL]: {
      label: "Social",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [SOLANA_CONNECTORS.PHANTOM]: {
      label: "Phantom",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultEvmDappModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  connectors: {
    [EVM_CONNECTORS.TORUS_EVM]: {
      label: "Torus Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [EVM_CONNECTORS.METAMASK]: {
      label: "MetaMask",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [EVM_CONNECTORS.SOCIAL]: {
      label: "Social",
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
    [SOLANA_CONNECTORS.SOCIAL]: {
      label: "Social",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultEvmWalletModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  connectors: {
    [EVM_CONNECTORS.SOCIAL]: {
      label: "Social",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultOtherModalConfig: ConnectorsModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  connectors: {
    [EVM_CONNECTORS.SOCIAL]: {
      label: "Social",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};
