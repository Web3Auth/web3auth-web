import { ConnectedAccountInfo, log, WalletInitializationError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseSwitchAccount {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  switchAccount(account: ConnectedAccountInfo): Promise<void>;
}

export const useSwitchAccount = (): IUseSwitchAccount => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const switchAccount = async (account: ConnectedAccountInfo): Promise<void> => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    error.value = null;
    loading.value = true;
    try {
      await web3Auth.value.switchAccount(account);
    } catch (err) {
      log.error("Error switching account", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    switchAccount,
  };
};
