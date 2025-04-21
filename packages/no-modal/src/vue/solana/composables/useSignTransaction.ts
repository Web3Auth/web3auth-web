import { Ref, ref } from "vue";

import { WalletInitializationError, type Web3AuthError } from "../../../base/errors";
import { TransactionOrVersionedTransaction } from "../../../providers/solana-provider";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignTransaction = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  signTransaction: (transaction: TransactionOrVersionedTransaction) => Promise<string>;
};

export const useSignTransaction = (): IUseSignTransaction => {
  const { solanaWallet } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signTransaction = async (transaction: TransactionOrVersionedTransaction) => {
    loading.value = true;
    error.value = null;
    try {
      if (!solanaWallet.value) throw WalletInitializationError.notReady();
      const signedTransaction = await solanaWallet.value.signTransaction(transaction);
      data.value = signedTransaction;
      return signedTransaction;
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
    signTransaction,
  };
};
