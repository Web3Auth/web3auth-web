import type { SolanaSignMessageFeature } from "@solana/wallet-standard-features";
import { SolanaSignMessage } from "@solana/wallet-standard-features";
import { useCallback, useState } from "react";

import { Web3AuthError } from "../../../base";
import { encodeBase58, toBytes } from "../../../utils/encoding";
import { useSolanaWallet } from "./useSolanaWallet";

export type IUseSignMessage = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  signMessage: (message: string) => Promise<string>;
};

export const useSignMessage = (): IUseSignMessage => {
  const { wallet, accounts } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signMessage = useCallback(
    async (message: string, from?: string) => {
      setLoading(true);
      setError(null);
      try {
        if (!wallet) throw new Error("Solana wallet not found");
        const feature = wallet.features[SolanaSignMessage] as SolanaSignMessageFeature[typeof SolanaSignMessage] | undefined;
        if (!feature) throw new Error("Solana wallet not found");
        const addr = from ?? accounts?.[0];
        if (!addr) throw new Error("No signing account");
        const account = wallet.accounts.find((a) => a.address === addr);
        if (!account) throw new Error("Account not found on wallet");

        const [out] = await feature.signMessage({ account, message: toBytes(message) });
        const signature = encodeBase58(new Uint8Array(out.signature));
        setData(signature);
        return signature;
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [wallet, accounts]
  );

  return { loading, error, data, signMessage };
};
