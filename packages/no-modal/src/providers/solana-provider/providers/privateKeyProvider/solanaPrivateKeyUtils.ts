import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { sign } from "@toruslabs/tweetnacl-js";
import { JRPCRequest, providerErrors, rpcErrors } from "@web3auth/auth";
import bs58 from "bs58";

import { SafeEventEmitterProvider, WalletInitializationError } from "@/core/base";

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

    signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<string> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const serializedTransaction = req.params.message;
      const transaction = VersionedTransaction.deserialize(Buffer.from(serializedTransaction, "base64"));
      transaction.sign([keyPair]);
      return bs58.encode(transaction.signatures[0]);
    },
    signMessage: async (req: JRPCRequest<{ data: string }>): Promise<string> => {
      if (!req.params?.data) {
        throw rpcErrors.invalidParams("data");
      }
      const signedMsg = sign.detached(Buffer.from(req.params.data, "utf-8"), keyPair.secretKey);
      return bs58.encode(signedMsg);
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<string> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const _providerEngineProxy = getProviderEngineProxy();
      if (!_providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });

      const serializedTransaction = req.params.message;
      const transaction = VersionedTransaction.deserialize(Buffer.from(serializedTransaction, "base64"));
      transaction.sign([keyPair]);

      const sig = await _providerEngineProxy.request<[string, { encoding: string; preflightCommitment: string }], string>({
        method: "sendTransaction",
        params: [Buffer.from(transaction.serialize()).toString("base64"), { encoding: "base64", preflightCommitment: "confirmed" }],
      });
      return sig;
    },

    signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<string[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw rpcErrors.invalidParams("message");
      }

      const txns = req.params?.message;
      const res = [];
      for (const tx of txns || []) {
        const serializedTransaction = tx;
        const transaction = VersionedTransaction.deserialize(Buffer.from(serializedTransaction, "base64"));
        transaction.sign([keyPair]);
        res.push(Buffer.from(transaction.serialize()).toString("base64"));
      }
      return res;
    },
  };

  return providerHandlers;
}
