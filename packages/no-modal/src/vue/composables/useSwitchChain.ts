import { Ref, ref } from "vue";

import { WalletInitializationError, Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseSwitchChain {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  switchChain: (chainParams: { chainId: string }) => Promise<void>;
}

export const useSwitchChain = (): IUseSwitchChain => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const switchChain = async (chainParams: { chainId: string }) => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      await web3Auth.value.switchChain(chainParams);
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    switchChain,
  };
};
