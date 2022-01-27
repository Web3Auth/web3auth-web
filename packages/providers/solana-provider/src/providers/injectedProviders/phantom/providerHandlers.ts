import { Transaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { IPhantomWalletProvider } from "../../../interface";
import { IProviderHandlers } from "../../../rpc/solanaRpcMiddlewares";

export const getPhantomHandlers = (injectedProvider: IPhantomWalletProvider): IProviderHandlers => {
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      return injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : [];
    },
    getAccounts: async () => (injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : []),
    getPrivateKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },
    signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
      const message = bs58.decode(req.params.message);
      const txn = Transaction.from(message);
      const transaction = await injectedProvider.signTransaction(txn);
      return transaction;
    },
    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      const message = await injectedProvider.request<Uint8Array>({
        method: "signMessage",
        params: {
          message: req.params?.message,
        },
      });
      return message;
    },
    signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
      const message = bs58.decode(req.params.message);
      const txn = Transaction.from(message);
      const txRes = await injectedProvider.signAndSendTransaction(txn);
      return { signature: txRes.signature };
    },
    signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const txns = req.params.message.map((msg) => {
        const decodedMsg = bs58.decode(msg);
        return Transaction.from(decodedMsg);
      });
      const transaction = await injectedProvider.signAllTransactions(txns);
      return transaction;
    },
  };
  return providerHandlers;
};
