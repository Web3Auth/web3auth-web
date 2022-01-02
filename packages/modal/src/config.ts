import { CHAIN_NAMESPACES, EVM_ADAPTERS, SOLANA_ADAPTERS } from "@web3auth/base";

import { AdaptersModalConfig } from "./interface";

export const defaultSolanaDappModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  requiredAdapters: {
    [SOLANA_ADAPTERS.OPENLOGIN]: { alternatives: [SOLANA_ADAPTERS.CUSTOM_AUTH] },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: { alternatives: [SOLANA_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [SOLANA_ADAPTERS.TORUS_SOLANA]: {
      label: "Torus Sol Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [SOLANA_ADAPTERS.OPENLOGIN]: {
      label: "OpenLogin",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: {
      label: "Custom Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.PHANTOM]: {
      label: "Phantom",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
  },
};

export const defaultEvmDappModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  requiredAdapters: {
    [EVM_ADAPTERS.OPENLOGIN]: { alternatives: [EVM_ADAPTERS.CUSTOM_AUTH] },
    [EVM_ADAPTERS.CUSTOM_AUTH]: { alternatives: [EVM_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [EVM_ADAPTERS.METAMASK]: {
      label: "MetaMask",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [EVM_ADAPTERS.TORUS_EVM]: {
      label: "Torus Eth Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [EVM_ADAPTERS.OPENLOGIN]: {
      label: "OpenLogin",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [EVM_ADAPTERS.CUSTOM_AUTH]: {
      label: "Custom Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [EVM_ADAPTERS.WALLET_CONNECT_V1]: {
      label: "Wallet Connect",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
  },
};

export const defaultSolanaWalletModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  requiredAdapters: {
    [SOLANA_ADAPTERS.OPENLOGIN]: { alternatives: [SOLANA_ADAPTERS.CUSTOM_AUTH] },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: { alternatives: [SOLANA_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [SOLANA_ADAPTERS.TORUS_SOLANA]: {
      label: "Torus Sol Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [SOLANA_ADAPTERS.OPENLOGIN]: {
      label: "OpenLogin",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: {
      label: "Custom Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
  },
};

export const defaultEvmWalletModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  requiredAdapters: {
    [EVM_ADAPTERS.OPENLOGIN]: { alternatives: [EVM_ADAPTERS.CUSTOM_AUTH] },
    [EVM_ADAPTERS.CUSTOM_AUTH]: { alternatives: [EVM_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [EVM_ADAPTERS.OPENLOGIN]: {
      label: "OpenLogin",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [EVM_ADAPTERS.CUSTOM_AUTH]: {
      label: "Custom Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
  },
};
