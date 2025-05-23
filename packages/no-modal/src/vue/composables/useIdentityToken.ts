import { Ref, ref, watch } from "vue";

import { WalletInitializationError, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseIdentityToken {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  token: Ref<string | null>;
  getIdentityToken: () => Promise<string | null>;
}

export const useIdentityToken = (): IUseIdentityToken => {
  const { web3Auth, isConnected } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const token = ref<string | null>(null);

  const getIdentityToken = async () => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      const result = await web3Auth.value.getIdentityToken();
      if (result?.idToken) {
        token.value = result.idToken;
      }
      return result?.idToken;
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  watch(isConnected, (newIsConnected) => {
    if (!newIsConnected && token.value) {
      token.value = null;
    }
  });

  return {
    loading,
    error,
    token,
    getIdentityToken,
  };
};
