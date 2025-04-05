import { WEB3AUTH_NETWORK } from "@web3auth/auth";
import { CHAIN_NAMESPACES, WIDGET_TYPE } from "@web3auth/modal";
import { reactive } from "vue";

import { chainConfigs, defaultLoginMethod, FormData, initWhiteLabel } from "../config";

export const formDataStore = reactive<FormData>({
  // authMode: "",
  connectors: [],
  network: WEB3AUTH_NETWORK.TESTNET,
  chainNamespaces: [CHAIN_NAMESPACES.EIP155],
  chains: [chainConfigs[CHAIN_NAMESPACES.EIP155][0], chainConfigs[CHAIN_NAMESPACES.EIP155][1]],
  defaultChainId: undefined,
  whiteLabel: {
    enable: false,
    config: initWhiteLabel,
  },
  loginProviders: [],
  showWalletDiscovery: true,
  multiInjectedProviderDiscovery: true,
  loginMethods: defaultLoginMethod,
  walletPlugin: {
    enable: false,
    confirmationStrategy: "default",
  },
  nftCheckoutPlugin: {
    enable: false,
  },
  useAccountAbstractionProvider: false,
  useAAWithExternalWallet: true,
  smartAccountType: "safe", // default smart account type to safe
  smartAccountChains: [],
  smartAccountChainsConfig: {},
  widget: WIDGET_TYPE.MODAL,
  targetId: "w3a-parent-test-container",
});
