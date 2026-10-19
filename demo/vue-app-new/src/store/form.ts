import { WEB3AUTH_NETWORK } from "@web3auth/auth";
import { CONNECTOR_INITIAL_AUTHENTICATION_MODE, WIDGET_TYPE } from "@web3auth/modal";
import { reactive } from "vue";

import { chainConfigs, defaultLoginMethod, FormData, initWhiteLabel, resolveBuildEnv, supportedChainNamespaces } from "../config";

export const formDataStore = reactive<FormData>({
  // authMode: "",
  connectors: [],
  initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
  consentConfigMode: "required",
  network: process.env.NODE_ENV === "production" ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  authBuildEnv: resolveBuildEnv(import.meta.env.VITE_APP_AUTH_BUILD_ENV),
  chainNamespaces: [...supportedChainNamespaces],
  chains: supportedChainNamespaces.flatMap((namespace) => chainConfigs[namespace]),
  defaultChainId: "0xa4b1",
  whiteLabel: {
    enable: false,
    config: initWhiteLabel,
    hideSuccessScreen: false,
  },
  loginProviders: [],
  showWalletDiscovery: true,
  multiInjectedProviderDiscovery: true,
  externalWalletOnly: false,
  loginMethods: defaultLoginMethod,
  walletPlugin: {
    enable: false,
    confirmationStrategy: "modal",
  },
  useAccountAbstractionProvider: false,
  useAAWithExternalWallet: true,
  smartAccountType: "metamask",
  smartAccountEipStandard: "4337",
  gaslessTransfers: false,
  useLocalWalletServices: false,
  erc20TokenAddress: "",
  erc20Recipient: "",
  erc20Amount: "1",
  smartAccountChains: [],
  smartAccountChainsConfig: {},
  tokenStorage: "default",
  widget: WIDGET_TYPE.MODAL,
  targetId: "w3a-parent-test-container",
});
