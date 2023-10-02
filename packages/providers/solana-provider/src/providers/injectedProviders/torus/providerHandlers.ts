import { rpcErrors } from "@metamask/rpc-errors";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";

import { ITorusWalletProvider, TransactionOrVersionedTransaction } from "../../../interface";
import { IProviderHandlers } from "../../../rpc/solanaRpcMiddlewares";

export const getTorusHandlers = (injectedProvider: ITorusWalletProvider): IProviderHandlers => {
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      const accounts = await injectedProvider.request<unknown, string[]>({
        method: "solana_requestAccounts",
        params: {},
      });
      return accounts;
    },

    getAccounts: async () => {
      const accounts = await injectedProvider.request<unknown, string[]>({
        method: "solana_requestAccounts",
        params: {},
      });
      return accounts;
    },

    getPrivateKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getSecretKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const message = await injectedProvider.signMessage(req.params.message);
      return message;
    },

    signTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<TransactionOrVersionedTransaction> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const txMessage = req.params.message;
      const response = await injectedProvider.signTransaction(txMessage);
      return response;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction }>): Promise<{ signature: string }> => {
      if (!req.params?.message) {
        throw rpcErrors.invalidParams("message");
      }
      const txMessage = req.params.message;
      const response = await injectedProvider.sendTransaction(txMessage);
      return { signature: response };
    },

    signAllTransactions: async (req: JRPCRequest<{ message: TransactionOrVersionedTransaction[] }>): Promise<TransactionOrVersionedTransaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw rpcErrors.invalidParams("message");
      }
      const transactions = req.params.message;
      const response = await injectedProvider.signAllTransactions(transactions);
      return response;
    },
  };
  return providerHandlers;
};
