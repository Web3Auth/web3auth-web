/* eslint-disable no-console */
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { ISlopeProvider } from "../../../interface";
import { IProviderHandlers } from "../../../rpc/solanaRpcMiddlewares";

export const getSlopeHandlers = (injectedProvider: ISlopeProvider, getProviderEngineProxy: () => SafeEventEmitterProvider): IProviderHandlers => {
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      const { data } = await injectedProvider.connect();
      return [data.publicKey];
    },
    getAccounts: async () => {
      const { data } = await injectedProvider.connect();
      return [data.publicKey];
    },
    getPrivateKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },
    signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
      console.log("signTransaction", req);
      const { data } = await injectedProvider.signTransaction(req.params.message);
      if (!data.publicKey || !data.signature) throw new Error("Invalid signature from slope wallet");
      const publicKey = new PublicKey(data.publicKey);
      const signature = bs58.decode(data.signature);
      const decodedTx = bs58.decode(req.params.message);
      const transaction = Transaction.from(decodedTx);
      transaction.addSignature(publicKey, signature);
      return transaction;
    },
    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      const response = await injectedProvider.signMessage(req.params.message);
      return bs58.decode(response.data.signature);
    },
    signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
      const provider = getProviderEngineProxy();
      if (!provider) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });

      const { data } = await injectedProvider.signTransaction(req.params.message);
      if (!data.publicKey || !data.signature) throw new Error("Invalid signature from slope wallet");
      const publicKey = new PublicKey(data.publicKey);
      const signature = bs58.decode(data.signature);
      const decodedTx = bs58.decode(req.params.message);
      const transaction = Transaction.from(decodedTx);
      transaction.addSignature(publicKey, signature);
      console.log("signature", signature);
      const chainConfig = (await provider.request<CustomChainConfig>({ method: "solana_provider_config", params: [] })) as CustomChainConfig;
      const conn = new Connection(chainConfig.rpcTarget);
      console.log("sending tx");
      console.log("serialized tx", transaction.serialize({ requireAllSignatures: false }));
      const res = await conn.sendRawTransaction(transaction.serialize({ requireAllSignatures: false }));
      return { signature: res };
    },
    signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const { msg, data } = await injectedProvider.signAllTransactions(req.params.message);

      const { length } = req.params.message;
      if (!data.publicKey || data.signatures?.length !== length) throw new Error(msg);

      const publicKey = new PublicKey(data.publicKey);

      const transactions = [];

      for (let i = 0; i < length; i++) {
        const signature = bs58.decode(data.signatures[i]);
        const decodedTx = bs58.decode(req.params.message[i]);
        const transaction = Transaction.from(decodedTx);
        transaction.addSignature(publicKey, signature);
        transactions[i].addSignature(publicKey, bs58.decode(data.signatures[i]));
        transactions.push(transaction);
      }

      return transactions;
    },
  };
  return providerHandlers;
};
