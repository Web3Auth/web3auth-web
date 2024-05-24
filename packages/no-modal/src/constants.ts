import { CHAIN_NAMESPACES, ChainNamespaceType } from "@web3auth/base";

type ChainMethodsType = {
  addChain: string;
  switchChain: string;
};

export const CHAIN_METHODS: Record<ChainNamespaceType, ChainMethodsType> = {
  [CHAIN_NAMESPACES.EIP155]: {
    addChain: "wallet_addEthereumChain",
    switchChain: "wallet_switchEthereumChain",
  },
  [CHAIN_NAMESPACES.SOLANA]: {
    addChain: "addSolanaChain",
    switchChain: "switchSolanaChain",
  },
  [CHAIN_NAMESPACES.XRPL]: {
    addChain: "xrpl_addChain",
    switchChain: "xrpl_switchChain",
  },
  [CHAIN_NAMESPACES.CASPER]: {
    addChain: "addCasperChain",
    switchChain: "switchCasperChain",
  },
  [CHAIN_NAMESPACES.OTHER]: {
    addChain: "addChain",
    switchChain: "switchChain",
  },
};
