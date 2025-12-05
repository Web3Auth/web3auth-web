import { log, WalletInitializationError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseEnableMFA {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  enableMFA<T>(params?: T): Promise<void>;
}

export const useEnableMFA = (): IUseEnableMFA => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const enableMFA = async () => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      await web3Auth.value.enableMFA();
    } catch (err) {
      log.error("Error enabling MFA", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    enableMFA,
  };
};
