import type { Transaction } from "@solana/kit";
import { Ref, ref } from "vue";

import { log, WalletInitializationError, walletSignTransaction, type Web3AuthError } from "../../../base";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignTransaction = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  /**
   * Signs a transaction and returns the base64-encoded wire transaction.
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signed transaction encoded as a base64 wire transaction
   */
  signTransaction: (transaction: Transaction) => Promise<string>;
};

export const useSignTransaction = (): IUseSignTransaction => {
  const { solanaWallet } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signTransaction = async (transaction: Transaction) => {
    loading.value = true;
    error.value = null;
    try {
      if (!solanaWallet.value) throw WalletInitializationError.notReady();
      const signedTransaction = await walletSignTransaction(solanaWallet.value, transaction);
      data.value = signedTransaction;
      return signedTransaction;
    } catch (err) {
      log.error("Error signing transaction", err);
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
