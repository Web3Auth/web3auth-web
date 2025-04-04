import type { ChainNamespaceType } from "@web3auth/no-modal";

export interface Chain {
  id: string;
  name: string;
  icon?: string;
}

export interface ConnectWalletChainFilterProps {
  isDark: boolean;
  isLoading: boolean;
  selectedChain: string;
  chainNamespace: ChainNamespaceType[];
  setSelectedChain: (chain: string) => void;
}
