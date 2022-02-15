import { BaseAdapterConfig, EVM_ADAPTERS, WALLET_ADAPTER_TYPE } from "@web3auth/base";

export const defaultEvmDappAdaptersConfig: Record<WALLET_ADAPTER_TYPE, BaseAdapterConfig> = {
  [EVM_ADAPTERS.TORUS_EVM]: {
    label: "Torus Eth Wallet",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
  [EVM_ADAPTERS.METAMASK]: {
    label: "MetaMask",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
  [EVM_ADAPTERS.OPENLOGIN]: {
    label: "OpenLogin",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
  [EVM_ADAPTERS.WALLET_CONNECT_V1]: {
    label: "Wallet Connect",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
};

export const defaultEvmWalletAdaptersConfig: Record<WALLET_ADAPTER_TYPE, BaseAdapterConfig> = {
  [EVM_ADAPTERS.OPENLOGIN]: {
    label: "OpenLogin",
    showOnModal: true,
    showOnMobile: true,
    showOnDesktop: true,
  },
};
