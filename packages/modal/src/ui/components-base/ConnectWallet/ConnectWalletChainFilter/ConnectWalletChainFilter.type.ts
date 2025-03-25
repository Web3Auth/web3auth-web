export interface Chain {
  id: string;
  name: string;
  icon?: string;
}

export interface ConnectWalletChainFilterProps {
  isDark: boolean;
  isLoading: boolean;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  chains: Chain[];
}
