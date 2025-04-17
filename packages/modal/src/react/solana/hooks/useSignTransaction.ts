import { Transaction } from "@solana/web3.js";
import { Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignTransaction = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  signTransaction: (transaction: Transaction) => Promise<string>;
};

export const useSignTransaction = () => {
  const { solanaWallet } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signTransaction = useCallback(
    async (transaction: Transaction) => {
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
