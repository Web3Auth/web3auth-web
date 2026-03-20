import { getTransactionEncoder, type Transaction } from "@solana/kit";
import type { SolanaSignAndSendTransactionFeature } from "@solana/wallet-standard-features";
import { SolanaSignAndSendTransaction } from "@solana/wallet-standard-features";
import { useCallback, useState } from "react";

import { Web3AuthError } from "../../../base";
import { WalletInitializationError } from "../../../base/errors";
import { encodeBase58 } from "../../../utils/encoding";
import { useSolanaWallet } from "./useSolanaWallet";

const transactionEncoder = getTransactionEncoder();

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
  const { wallet } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction) => {
      setLoading(true);
      setError(null);
      try {
        if (!wallet) throw WalletInitializationError.notReady();
        const feature = wallet.features[SolanaSignAndSendTransaction] as
          | SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction]
          | undefined;
        if (!feature) throw WalletInitializationError.notReady();
        const account = wallet.accounts[0];
        const chain = wallet.chains[0];
        if (!account || !chain) throw WalletInitializationError.notReady();

        const wire = new Uint8Array(transactionEncoder.encode(transaction));
        const [out] = await feature.signAndSendTransaction({ account, transaction: wire, chain });
        const signature = encodeBase58(new Uint8Array(out.signature));
        setData(signature);
        return signature;
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  return { loading, error, data, signAndSendTransaction };
};
