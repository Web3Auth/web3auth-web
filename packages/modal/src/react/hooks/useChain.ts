import { ChainNamespaceType, CustomChainConfig } from "@web3auth/no-modal";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export const useChain = (namespace: ChainNamespaceType): CustomChainConfig | undefined => {
  const { web3Auth, currentChainIds } = useWeb3AuthInner();
  void currentChainIds;
  return web3Auth?.getCurrentChain(namespace);
};
