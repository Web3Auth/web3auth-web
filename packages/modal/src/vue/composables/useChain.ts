import { ChainNamespaceType } from "@web3auth/no-modal";
import { computed, ComputedRef } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IUseChain = {
  chainId: ComputedRef<string | null>;
  chainNamespace: ComputedRef<ChainNamespaceType | null>;
};

export const useChain = (): IUseChain => {
  const context = useWeb3AuthInner();

  const chainId = computed(() => {
    if (!context.web3Auth.value?.currentChain) return null;
    return context.web3Auth.value.currentChain.chainId;
  });

  const chainNamespace = computed(() => {
    if (!context.web3Auth.value?.currentChain) return null;
    return context.web3Auth.value.currentChain.chainNamespace;
  });

  return {
    chainId,
    chainNamespace,
  };
};
