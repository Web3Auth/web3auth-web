import { Ref } from "vue";

import { ChainNamespaceType } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IUseChain = {
  chainId: Ref<string | null>;
  chainNamespace: Ref<ChainNamespaceType | null>;
};

export const useChain = (): IUseChain => {
  const context = useWeb3AuthInner();

  return {
    chainId: context.chainId,
    chainNamespace: context.chainNamespace,
  };
};
