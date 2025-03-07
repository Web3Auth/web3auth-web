import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { sign } from "@toruslabs/tweetnacl-js";
import { JRPCRequest, providerErrors, rpcErrors } from "@web3auth/auth";
import bs58 from "bs58";

import { SafeEventEmitterProvider, WalletInitializationError } from "@/core/base";

import { TransactionOrVersionedTransaction } from "../../interface";
import { ISolanaProviderHandlers } from "../../rpc";

export async function getProviderHandlers({
  privKey,
  keyExportEnabled,
  getProviderEngineProxy,
}: {
  privKey: string;
  keyExportEnabled: boolean;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): Promise<ISolanaProviderHandlers> {
  const keyPairGenerator = (): Keypair => {
    return Keypair.fromSecretKey(Buffer.from(privKey, "hex"));
  };
  if (typeof privKey !== "string") throw WalletInitializationError.invalidParams("privKey must be a string");
  const keyPair = keyPairGenerator();
  const providerHandlers: ISolanaProviderHandlers = {
    requestAccounts: async () => {
      return [keyPair.publicKey.toBase58()];
    },
    getAccounts: async () => [keyPair.publicKey.toBase58()],
    getPublicKey: async () => keyPair.publicKey.toBase58(),
    getPrivateKey: async () => {
      if (!keyExportEnabled) {
        throw providerErrors.custom({ message: "Private key export is disabled", code: 4902 });
      }
      return privKey;
    },
    getSecretKey: async () => bs58.encode(keyPair.secretKey),

    signTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<TransactionOrVersionedTransaction> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const transaction = req.params.message;
      if ((transaction as VersionedTransaction).version !== undefined || transaction instanceof VersionedTransaction) {
        (transaction as VersionedTransaction).sign([keyPair]);
      } else {
        transaction.partialSign(keyPair);
      }
      return transaction;
    },

    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const signedMsg = sign.detached(req.params.message, keyPair.secretKey);
      return signedMsg;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<{ signature: string }> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const _providerEngineProxy = getProviderEngineProxy();
      if (!_providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });

      const transaction = req.params.message;
      if ((transaction as VersionedTransaction).version !== undefined || transaction instanceof VersionedTransaction) {
        (transaction as VersionedTransaction).sign([keyPair]);
      } else {
        transaction.partialSign(keyPair);
      }
      const sig = await _providerEngineProxy.request<[string, { encoding: string; preflightCommitment: string }], string>({
        method: "sendTransaction",
        params: [Buffer.from(transaction.serialize()).toString("base64"), { encoding: "base64", preflightCommitment: "confirmed" }],
      });
      return { signature: sig };
    },

    signAllTransactions: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction[] }>): Promise<TransactionOrVersionedTransaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw rpcErrors.invalidParams("message");
      }

      const txns = req.params?.message;
      for (const tx of txns || []) {
        const transaction = tx;
        if ((transaction as VersionedTransaction).version !== undefined || transaction instanceof VersionedTransaction) {
          (transaction as VersionedTransaction).sign([keyPair]);
        } else {
          transaction.partialSign(keyPair);
        }
      }
      return txns;
    },
  };

  return providerHandlers;
}
