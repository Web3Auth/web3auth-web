import { getTransactionDecoder, getTransactionEncoder, type Transaction } from "@solana/kit";
import type { SolanaSignTransactionFeature } from "@solana/wallet-standard-features";
import { SolanaSignTransaction } from "@solana/wallet-standard-features";
import { useCallback, useState } from "react";

import { Web3AuthError } from "../../../base";
import { WalletInitializationError } from "../../../base/errors";
import { encodeBase58 } from "../../../utils/encoding";
import { useSolanaWallet } from "./useSolanaWallet";

const transactionDecoder = getTransactionDecoder();
const transactionEncoder = getTransactionEncoder();

export type IUseSignTransaction = {
  loading: boolean;
  error: Web3AuthError | null;
  data: string | null;
  /**
   * Signs a transaction and returns the signature
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signature of the transaction encoded in base58
   */
  signTransaction: (transaction: Transaction) => Promise<string>;
};

export const useSignTransaction = () => {
  const { wallet } = useSolanaWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [data, setData] = useState<string | null>(null);

  const signTransaction = useCallback(
    async (transaction: Transaction) => {
      setLoading(true);
      setError(null);
      try {
        if (!wallet) throw WalletInitializationError.notReady();
        const signFeature = wallet.features[SolanaSignTransaction] as SolanaSignTransactionFeature[typeof SolanaSignTransaction] | undefined;
        if (!signFeature) throw WalletInitializationError.notReady();
        const account = wallet.accounts[0];
        const chain = wallet.chains[0];
        if (!account || !chain) throw WalletInitializationError.notReady();

        const wire = new Uint8Array(transactionEncoder.encode(transaction));
        const [out] = await signFeature.signTransaction({ account, transaction: wire, chain });
        const decodedSigned = transactionDecoder.decode(out.signedTransaction);
        const keys = Object.keys(decodedSigned.signatures) as (keyof typeof decodedSigned.signatures)[];
        const firstKey = keys[0];
        if (!firstKey) throw new Error("No signer in transaction");
        const sigBytes = decodedSigned.signatures[firstKey];
        if (!sigBytes) throw new Error("Missing signature");
        const signature = encodeBase58(new Uint8Array(sigBytes));
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

  return {
    loading,
    error,
    data,
    signTransaction,
  };
};
