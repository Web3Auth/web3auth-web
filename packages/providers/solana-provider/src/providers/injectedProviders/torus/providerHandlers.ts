import { PublicKey, Transaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
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
    getSecretKey: async () => {
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

    signTransaction: async (req: JRPCRequest<{ message: Transaction }>): Promise<Transaction> => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const txMessage = req.params.message;
      const response = await injectedProvider.request<string>({
        method: "sign_transaction",
        params: { message: txMessage.serializeMessage(), messageOnly: true },
      });

      const parsed = JSON.parse(response);

      const signature = { publicKey: new PublicKey(parsed.publicKey), signature: Buffer.from(parsed.signature, "hex") };
      txMessage.addSignature(signature.publicKey, signature.signature);
      return txMessage;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: Transaction }>): Promise<{ signature: string }> => {
      if (!req.params?.message) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const txMessage = req.params.message;
      const response = await injectedProvider.request<string>({
        method: "send_transaction",
        params: { message: txMessage.serialize({ requireAllSignatures: false }).toString("hex") },
      });
      return { signature: response };
    },

    signAllTransactions: async (req: JRPCRequest<{ message: Transaction[] }>): Promise<Transaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const transactions = req.params.message;
      const encodedMessages: string[] = transactions.map((tx) => {
        return tx.serializeMessage().toString("hex");
      });
      const response = await injectedProvider.request<string[]>({
        method: "sign_all_transactions",
        params: { message: encodedMessages, messageOnly: true },
      });

      // reconstruct signature pairs
      const signatures = response.map((sig) => {
        const parsed = JSON.parse(sig);
        return { publicKey: new PublicKey(parsed.publicKey), signature: Buffer.from(parsed.signature, "hex") };
      });
      transactions.forEach((tx, idx) => {
        tx.addSignature(signatures[idx].publicKey, signatures[idx].signature);
      });
      return transactions;
    },
  };
  return providerHandlers;
};
