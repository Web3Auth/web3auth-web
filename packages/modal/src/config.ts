import { CHAIN_NAMESPACES, EVM_ADAPTERS, SOLANA_ADAPTERS } from "@web3auth/base";

import { DefaultAdaptersModalConfig } from "./interface";

export const defaultSolanaDappModalConfig: DefaultAdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  requiredAdapters: {
    [SOLANA_ADAPTERS.OPENLOGIN]: { alternatives: [SOLANA_ADAPTERS.CUSTOM_AUTH] },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: { alternatives: [SOLANA_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [SOLANA_ADAPTERS.TORUS_SOLANA]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [SOLANA_ADAPTERS.OPENLOGIN]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.PHANTOM]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
  },
};

export const defaultEvmDappModalConfig: DefaultAdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  requiredAdapters: {
    [EVM_ADAPTERS.OPENLOGIN]: { alternatives: [EVM_ADAPTERS.CUSTOM_AUTH] },
    [EVM_ADAPTERS.CUSTOM_AUTH]: { alternatives: [EVM_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [EVM_ADAPTERS.METAMASK]: {
      // label: "metaMask",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [EVM_ADAPTERS.TORUS_EVM]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [EVM_ADAPTERS.OPENLOGIN]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [EVM_ADAPTERS.CUSTOM_AUTH]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
  },
};

export const defaultSolanaWalletModalConfig: DefaultAdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  requiredAdapters: {
    [SOLANA_ADAPTERS.OPENLOGIN]: { alternatives: [SOLANA_ADAPTERS.CUSTOM_AUTH] },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: { alternatives: [SOLANA_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [SOLANA_ADAPTERS.TORUS_SOLANA]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [SOLANA_ADAPTERS.OPENLOGIN]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
  },
};

export const defaultEvmWalletModalConfig: DefaultAdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  requiredAdapters: {
    [EVM_ADAPTERS.OPENLOGIN]: { alternatives: [EVM_ADAPTERS.CUSTOM_AUTH] },
    [EVM_ADAPTERS.CUSTOM_AUTH]: { alternatives: [EVM_ADAPTERS.OPENLOGIN] },
  },
  adapters: {
    [EVM_ADAPTERS.OPENLOGIN]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [EVM_ADAPTERS.CUSTOM_AUTH]: {
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
  },
};
