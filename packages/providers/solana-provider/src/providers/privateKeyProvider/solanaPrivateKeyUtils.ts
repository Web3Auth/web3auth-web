import { Keypair, Message, Transaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import nacl from "@toruslabs/tweetnacl-js";
import { SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { SignedMessage } from "../../interface";
import { IProviderHandlers } from "../../rpc/solanaRpcMiddlewares";

export async function getProviderHandlers({
  privKey,
  getProviderEngineProxy,
}: {
  privKey: string;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): Promise<IProviderHandlers> {
  const transactionGenerator = (serializedTx: string): Transaction => {
    const decodedTx = bs58.decode(serializedTx);
    const tx = Transaction.populate(Message.from(decodedTx));
    return tx;
  };

  const getSignature = (msg: string, secretKey: Uint8Array): string => {
    return bs58.encode(nacl.sign.detached(bs58.decode(msg), secretKey));
  };

  const keyPairGenerator = (): Keypair => {
    return Keypair.fromSecretKey(Buffer.from(privKey, "hex"));
  };

  if (typeof privKey !== "string") throw WalletInitializationError.invalidParams("privKey must be a string");
  const keyPair = keyPairGenerator();
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      return [keyPair.publicKey.toBase58()];
    },
    getAccounts: async () => [keyPair.publicKey.toBase58()],

    getPrivateKey: async () => privKey,

    signTransaction: (req: JRPCRequest<{ message: string }>): SignedMessage => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const message = req.params?.message;
      const signature = getSignature(message, keyPair.secretKey);
      return { pubkey: keyPair.publicKey.toBase58(), signature };
    },

    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const signedMsg = nacl.sign.detached(req.params.message, keyPair.secretKey);
      return signedMsg;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const _providerEngineProxy = getProviderEngineProxy();
      if (!_providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });

      const transaction = transactionGenerator(req.params?.message as string);
      transaction.sign(keyPair);

      const sig = await _providerEngineProxy.request<string>({
        method: "sendTransaction",
        params: [bs58.encode(transaction.serialize())],
      });
      return { signature: sig };
    },

    signAllTransactions: (req: JRPCRequest<{ message: string[] }>): SignedMessage[] => {
      if (!req.params?.message || !req.params?.message.length) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const signedTransactions = [];
      for (const tx of req.params?.message || []) {
        const signature = getSignature(tx, keyPair.secretKey);
        signedTransactions.push({ pubkey: keyPair.publicKey.toBase58(), signature });
      }
      return signedTransactions;
    },
  };

  return providerHandlers;
}
