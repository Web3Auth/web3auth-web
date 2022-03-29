import { CHAIN_NAMESPACES, IWalletConnectExtensionAdapter } from "@web3auth/base";

export const WALLET_CONNECT_EXTENSION_ADAPTERS: IWalletConnectExtensionAdapter[] = [
  {
    name: "Rainbow",
    chains: [CHAIN_NAMESPACES.EIP155],
    logo: "",
    mobile: {
      native: "rainbow:",
      universal: "https://rnbwapp.com",
    },
    desktop: {
      native: "",
      universal: "",
    },
  },
];
