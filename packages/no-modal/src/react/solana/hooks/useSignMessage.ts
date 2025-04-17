import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";

import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignMessage = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  signMessage: (message: string) => Promise<string>;
};

export const useSignMessage = (): IUseSignMessage => {
  const { solanaWallet, accounts } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signMessage = useCallback(
    async (message: string, from?: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!solanaWallet) throw new Error("Solana wallet not found");
        const signature = await solanaWallet.signMessage(message, from ?? accounts?.[0]);
        setData(signature);
        return signature;
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [solanaWallet, accounts]
  );

  return { loading, error, data, signMessage };
};
