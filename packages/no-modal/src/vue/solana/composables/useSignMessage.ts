import { Ref, ref } from "vue";

import { WalletInitializationError, type Web3AuthError } from "../../../base/errors";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignMessage = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  signMessage: (message: string, from?: string) => Promise<string>;
};

export const useSignMessage = (): IUseSignMessage => {
  const { solanaWallet, accounts } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signMessage = async (message: string, from?: string) => {
    loading.value = true;
    error.value = null;
    try {
      if (!solanaWallet.value) throw WalletInitializationError.notReady();
      const signature = await solanaWallet.value.signMessage(message, from ?? accounts.value?.[0]);
      data.value = signature;
      return signature;
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    data,
    signMessage,
  };
};
