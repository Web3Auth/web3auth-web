import { Ref, ref } from "vue";

import { log, WalletInitializationError, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthDisconnect {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
}

export const useWeb3AuthDisconnect = (): IUseWeb3AuthDisconnect => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const disconnect = async (options?: { cleanup: boolean }) => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      await web3Auth.value.logout(options);
    } catch (err) {
      log.error("Error disconnecting", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    disconnect,
  };
};
