import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";
import { TransactionOrVersionedTransaction } from "@/core/solana-provider";

import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignTransaction = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  signTransaction: (transaction: TransactionOrVersionedTransaction) => Promise<string>;
};

export const useSignTransaction = () => {
  const { solanaWallet } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signTransaction = useCallback(
    async (transaction: TransactionOrVersionedTransaction) => {
      setLoading(true);
      setError(null);
      try {
        const signedTransaction = await solanaWallet.signTransaction(transaction);
        setData(signedTransaction);
        return signedTransaction;
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [solanaWallet]
  );

  return {
    loading,
    error,
    data,
    signTransaction,
  };
};
