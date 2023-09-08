import { rpcErrors } from "@metamask/rpc-errors";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import bs58 from "bs58";

import { IBaseWalletProvider, TransactionOrVersionedTransaction } from "../../../interface";
import { IProviderHandlers } from "../../../rpc/solanaRpcMiddlewares";

export const getBaseProviderHandlers = (injectedProvider: IBaseWalletProvider): IProviderHandlers => {
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      return injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : [];
    },
    getAccounts: async () => (injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : []),
    getPrivateKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getSecretKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    signTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<TransactionOrVersionedTransaction> => {
      const transaction = await injectedProvider.signTransaction(req.params.message);
      return transaction;
    },
    signMessage: async (req: JRPCRequest<{ message: Uint8Array; display?: string }>): Promise<Uint8Array> => {
      const sigData = await injectedProvider.signMessage(req.params.message, req.params.display as "utf8" | "hex");
      return sigData.signature;
    },
    signAllTransactions: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction[] }>): Promise<TransactionOrVersionedTransaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw rpcErrors.invalidParams("message");
      }
      const transaction = await injectedProvider.signAllTransactions(req.params.message);
      return transaction;
    },
    signAndSendTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<{ signature: string }> => {
      const txRes = await injectedProvider.signAndSendTransaction(req.params.message);
      return { signature: txRes.signature };
    },
  };
  return providerHandlers;
};
