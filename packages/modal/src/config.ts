import { CHAIN_NAMESPACES, EVM_ADAPTERS, SOLANA_ADAPTERS } from "@web3auth/base";

import { DefaultAdaptersModalConfig } from "./interface";

export const defaultSolanaModalConfig: DefaultAdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  adapters: {
    [SOLANA_ADAPTERS.TORUS_SOLANA]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
      // options: { chainConfig: { chainId: 3, host: "ropsten" } },
    },
    [SOLANA_ADAPTERS.OPENLOGIN]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.CUSTOM_AUTH]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [SOLANA_ADAPTERS.PHANTOM]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
  },
};

export const defaultEvmModalConfig: DefaultAdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  adapters: {
    [EVM_ADAPTERS.METAMASK]: {
      // label: "metaMask",
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [EVM_ADAPTERS.TORUS_EVM]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: false,
    },
    [EVM_ADAPTERS.OPENLOGIN]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
    [EVM_ADAPTERS.CUSTOM_AUTH]: {
      visible: true,
      showOnMobile: true,
      showOnDesktop: true,
      configurationRequired: true,
    },
  },
};
