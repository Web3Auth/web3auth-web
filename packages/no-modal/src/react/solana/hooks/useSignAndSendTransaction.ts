import type { Transaction } from "@solana/kit";
import { useCallback, useState } from "react";

import { Web3AuthError } from "../../../base";
import { WalletInitializationError } from "../../../base/errors";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignAndSendTransaction = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  /**
   * Signs and sends a transaction to the network
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signature of the transaction encoded in base58
   */
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
};

export const useSignAndSendTransaction = (): IUseSignAndSendTransaction => {
  const { solanaWallet } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction) => {
      setLoading(true);
      setError(null);
      try {
        if (!solanaWallet) throw WalletInitializationError.notReady();
        const signature = await solanaWallet.signAndSendTransaction(transaction);
        setData(signature);
        return signature;
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [solanaWallet]
  );

  return { loading, error, data, signAndSendTransaction };
};
