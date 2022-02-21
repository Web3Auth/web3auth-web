import { BaseAdapterConfig, SOLANA_ADAPTERS } from "@web3auth/base";

export const defaultSolanaAdaptersConfig: Record<string, BaseAdapterConfig> = {
  [SOLANA_ADAPTERS.TORUS_SOLANA]: {
    label: "Torus Solana Wallet",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
  [SOLANA_ADAPTERS.OPENLOGIN]: {
    label: "OpenLogin",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
  [SOLANA_ADAPTERS.PHANTOM]: {
    label: "Phantom",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
};
