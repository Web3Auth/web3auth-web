import { Ref, ref } from "vue";

import { log, WalletInitializationError, type Web3AuthError } from "../../../base";
import { encodeBase58, toBytes } from "../../../utils/encoding";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignMessage = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  signMessage: (message: string) => Promise<string>;
};

export const useSignMessage = (): IUseSignMessage => {
  const { client } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signMessage = async (message: string) => {
    loading.value = true;
    error.value = null;
    try {
      if (!client.value) throw WalletInitializationError.notReady();
      const wallet = client.value.store.getState().wallet;
      if (wallet.status !== "connected" || !wallet.session?.signMessage) {
        throw WalletInitializationError.notReady();
      }

      const signatureBytes = await wallet.session.signMessage(toBytes(message));
      const signature = encodeBase58(signatureBytes);
      data.value = signature;
      return signature;
    } catch (err) {
      log.error("Error signing message", err);
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
