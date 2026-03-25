import { ChainNamespaceType, CustomChainConfig } from "@web3auth/no-modal";
import { computed, ComputedRef } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export const useChain = (namespace: ChainNamespaceType): ComputedRef<CustomChainConfig | undefined> => {
  const context = useWeb3AuthInner();
  return computed(() => {
    void context.currentChainIds.value;
    return context.web3Auth.value?.getCurrentChain(namespace);
  });
};
