import { ChainNamespaceType } from "@web3auth/no-modal";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IUseChain = {
  chainId: string | null;
  chainNamespace: ChainNamespaceType | null;
};

export const useChain = (): IUseChain => {
  const { chainId, chainNamespace } = useWeb3AuthInner();
  return {
    chainId,
    chainNamespace,
  };
};
