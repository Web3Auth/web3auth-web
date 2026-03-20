import { getBase64EncodedWireTransaction, type SendableTransaction, type Transaction } from "@solana/kit";
import { Ref, ref } from "vue";

import { log } from "../../../base";
import { WalletInitializationError, type Web3AuthError } from "../../../base/errors";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignTransaction = {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  data: Ref<string | null>;
  /**
   * Signs a transaction and returns the signature
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signature of the transaction encoded in base58
   */
  signTransaction: (transaction: Transaction) => Promise<string>;
};

export const useSignTransaction = (): IUseSignTransaction => {
  const { client } = useSolanaWallet();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const data = ref<string | null>(null);

  const signTransaction = async (transaction: Transaction) => {
    loading.value = true;
    error.value = null;
    try {
      if (!client.value) throw WalletInitializationError.notReady();
      const wallet = client.value.store.getState().wallet;
      if (wallet.status !== "connected" || !wallet.session?.signTransaction) {
        throw WalletInitializationError.notReady();
      }

      const signedTx = await wallet.session.signTransaction(transaction as SendableTransaction & Transaction);
      const encodedTx = getBase64EncodedWireTransaction(signedTx);
      data.value = encodedTx;
      return encodedTx;
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
