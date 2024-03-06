import { providerErrors, rpcErrors } from "@metamask/rpc-errors";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";

import { TransactionOrVersionedTransaction } from "../../interface";
import { IProviderHandlers } from "../../rpc/solanaRpcMiddlewares";
import { SigningMethods } from ".";

export async function getProviderHandlers({
  signingMethods,
  getProviderEngineProxy,
}: {
  signingMethods: SigningMethods;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): Promise<IProviderHandlers> {
  const pubKeyB58 = async () => bs58.encode(await signingMethods.getPubKey());
  const signTx = async (transaction: TransactionOrVersionedTransaction) => {
    if (transaction instanceof VersionedTransaction) {
      // VersionedTransaction
      const messageData = transaction.message.serialize() as Buffer;
      const sig = await signingMethods.sign(messageData);
      const pk = PublicKey.decode(await signingMethods.getPubKey());
      transaction.addSignature(pk, sig);
    } else {
      // Transaction
      const pk = PublicKey.decode(await signingMethods.getPubKey());
      const signData = transaction.serializeMessage();
      const sig = await signingMethods.sign(signData);
      transaction.addSignature(pk, sig);
    }
  };

  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      return [await pubKeyB58()];
    },
    getAccounts: async () => [await pubKeyB58()],

    getPrivateKey: async () => {
      throw rpcErrors.invalidRequest("private key not available");
    },
    getSecretKey: async () => {
      throw rpcErrors.invalidRequest("secret key not available");
    },

    signTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<TransactionOrVersionedTransaction> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const transaction = req.params.message;
      await signTx(transaction);
      return transaction;
    },

    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const signedMsg = signingMethods.sign(Buffer.from(req.params.message));
      return signedMsg;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<{ signature: string }> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const _providerEngineProxy = getProviderEngineProxy();
      if (!_providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });

      const transaction = req.params.message;
      await signTx(transaction);
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
        await signTx(transaction);
      }
      return txns;
    },
  };

  return providerHandlers;
}
