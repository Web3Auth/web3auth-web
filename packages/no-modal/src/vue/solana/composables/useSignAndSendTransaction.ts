import type { Transaction } from "@solana/kit";
import { Ref, ref } from "vue";

import { log } from "../../../base";
import { WalletInitializationError, type Web3AuthError } from "../../../base/errors";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignAndSendTransaction = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  /**
   * Signs and sends a transaction to the network
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signature of the transaction encoded in base58
   */
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
};

export const useSignAndSendTransaction = (): IUseSignAndSendTransaction => {
  const { solanaWallet } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signAndSendTransaction = async (transaction: Transaction) => {
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
