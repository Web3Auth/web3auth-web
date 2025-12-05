import { Ref, ref } from "vue";

import { log } from "../../../base";
import { WalletInitializationError, type Web3AuthError } from "../../../base/errors";
import type { TransactionOrVersionedTransaction } from "../../../providers/solana-provider";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignAndSendTransaction = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  signAndSendTransaction: (transaction: TransactionOrVersionedTransaction) => Promise<string>;
};

export const useSignAndSendTransaction = (): IUseSignAndSendTransaction => {
  const { solanaWallet } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signAndSendTransaction = async (transaction: TransactionOrVersionedTransaction) => {
    loading.value = true;
    error.value = null;
    try {
      if (!solanaWallet.value) throw WalletInitializationError.notReady();
      const signature = await solanaWallet.value.signAndSendTransaction(transaction);
      data.value = signature;
      return signature;
    } catch (err) {
      log.error("Error signing and sending transaction", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    data,
    signAndSendTransaction,
  };
};
