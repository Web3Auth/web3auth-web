import { Transaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { IProviderHandlers } from "../../../rpc/solanaRpcMiddlewares";
import { InjectedProvider } from "../interface";

export const getTorusHandlers = (injectedProvider: InjectedProvider): IProviderHandlers => {
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      const accounts = await injectedProvider.request<string[]>({
        method: "solana_requestAccounts",
        params: {},
      });
      return accounts;
    },

    getAccounts: async () => {
      const accounts = await injectedProvider.request<string[]>({
        method: "solana_accounts",
        params: {},
      });
      return accounts;
    },

    getPrivateKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },

    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      const message = await injectedProvider.request<Uint8Array>({
        method: "sign_message",
        params: {
          data: req.params?.message,
        },
      });
      return message;
    },

    signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const message = bs58.decode(req.params.message).toString("hex");
      const response = await injectedProvider.request<string>({
        method: "sign_transaction",
        params: { message },
      });

      const buf = Buffer.from(response, "hex");
      const sendTx = Transaction.from(buf);
      return sendTx;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const message = bs58.decode(req.params.message).toString("hex");

      const response = await injectedProvider.request<string>({
        method: "send_transaction",
        params: { message },
      });
      return { signature: response };
    },

    signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const messages: string[] = [];
      for (const transaction of req.params.message) {
        const message = bs58.decode(transaction).toString("hex");
        messages.push(message);
      }
      const response = await injectedProvider.request<Transaction[]>({
        method: "sign_all_transactions",
        params: { message: messages },
      });
      return response;
    },
  };
  return providerHandlers;
};
