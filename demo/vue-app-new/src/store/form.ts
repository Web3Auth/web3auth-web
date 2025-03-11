import { WEB3AUTH_NETWORK } from "@web3auth/auth";
import { CHAIN_NAMESPACES } from "@web3auth/modal";
import { reactive } from "vue";

import { defaultLoginMethod, FormData, initWhiteLabel } from "../config";

export const formDataStore = reactive<FormData>({
  // authMode: "",
  network: WEB3AUTH_NETWORK.TESTNET,
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chain: CHAIN_NAMESPACES.EIP155,
  whiteLabel: {
    enable: false,
    config: initWhiteLabel,
  },
  loginProviders: [],
  adapters: [],
  showWalletDiscovery: true,
  loginMethods: defaultLoginMethod,
  walletPlugin: {
    enable: false,
    logoLight: "",
    logoDark: "",
    confirmationStrategy: "default",
  },
  nftCheckoutPlugin: {
    enable: false,
  },
  useAccountAbstractionProvider: false,
  useAAWithExternalWallet: true,
  widget: "modal",
  targetId: "w3a-parent-test-container",
});
