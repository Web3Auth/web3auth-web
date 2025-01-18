import { CHAIN_NAMESPACES, EVM_ADAPTERS, SOLANA_ADAPTERS } from "@web3auth/no-modal";

import { AdaptersModalConfig } from "./interface";

export const defaultSolanaDappModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  adapters: {
    [SOLANA_ADAPTERS.TORUS_SOLANA]: {
      label: "Torus Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [SOLANA_ADAPTERS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultEvmDappModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  adapters: {
    [EVM_ADAPTERS.TORUS_EVM]: {
      label: "Torus Wallet",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [EVM_ADAPTERS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
    [EVM_ADAPTERS.WALLET_CONNECT_V2]: {
      label: "Wallet Connect",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultSolanaWalletModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  adapters: {
    [SOLANA_ADAPTERS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultEvmWalletModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  adapters: {
    [EVM_ADAPTERS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const defaultOtherModalConfig: AdaptersModalConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  adapters: {
    [EVM_ADAPTERS.AUTH]: {
      label: "Auth",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    },
  },
};

export const walletRegistryUrl = "https://assets.web3auth.io/v1/wallet-registry.json";
