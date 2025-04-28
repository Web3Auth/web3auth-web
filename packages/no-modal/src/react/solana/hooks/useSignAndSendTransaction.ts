import { useCallback, useState } from "react";

import { Web3AuthError } from "../../../base";
import { TransactionOrVersionedTransaction } from "../../../providers/solana-provider";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignAndSendTransaction = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  signAndSendTransaction: (transaction: TransactionOrVersionedTransaction) => Promise<string>;
};

export const useSignAndSendTransaction = (): IUseSignAndSendTransaction => {
  const { solanaWallet } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signAndSendTransaction = useCallback(
    async (transaction: TransactionOrVersionedTransaction) => {
      setLoading(true);
      setError(null);
      try {
        if (!solanaWallet) throw new Error("Solana wallet not found");
        const signature = await solanaWallet.signAndSendTransaction(transaction);
        setData(signature);
        return signature;
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [solanaWallet]
  );

  return { loading, error, data, signAndSendTransaction };
};
