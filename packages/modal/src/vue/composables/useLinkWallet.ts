import { log, WalletInitializationError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseLinkWallet {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  linkWallet(): Promise<void>;
}

export const useLinkWallet = (): IUseLinkWallet => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const linkWallet = async () => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      await web3Auth.value.linkWallet();
    } catch (err) {
      log.error("Error opening link wallet", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    linkWallet,
  };
};
