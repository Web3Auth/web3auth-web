import { Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignMessage = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  signMessage: (message: string) => Promise<string>;
};

export const useSignMessage = (): IUseSignMessage => {
  const { solanaWallet, address } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signMessage = useCallback(
    async (message: string, from?: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!solanaWallet) throw new Error("Solana wallet not found");
        const signature = await solanaWallet.signMessage(message, from ?? address[0]);
        setData(signature);
        return signature;
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [solanaWallet, address]
  );

  return { loading, error, data, signMessage };
};
