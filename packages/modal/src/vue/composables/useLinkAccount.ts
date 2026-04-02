import { type LinkAccountParams, type LinkAccountResult, log, WalletInitializationError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseLinkAccount {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  linkAccount(params: LinkAccountParams): Promise<LinkAccountResult | void>;
}

export const useLinkAccount = (): IUseLinkAccount => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const linkAccount = async (params: LinkAccountParams): Promise<LinkAccountResult | void> => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      return await web3Auth.value.linkAccount(params);
    } catch (err) {
      log.error("Error linking account", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    linkAccount,
  };
};
