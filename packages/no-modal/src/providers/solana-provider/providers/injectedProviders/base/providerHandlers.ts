import { bs58 } from "@toruslabs/bs58";
import { JRPCRequest, rpcErrors } from "@web3auth/auth";

import { IBaseWalletProvider } from "../../../interface";
import { ISolanaProviderHandlers } from "../../../rpc";

export const getBaseProviderHandlers = (injectedProvider: IBaseWalletProvider): ISolanaProviderHandlers => {
  const providerHandlers: ISolanaProviderHandlers = {
    requestAccounts: async () => {
      return injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : [];
    },
    getPublicKey: async () => {
      return injectedProvider.publicKey ? bs58.encode(injectedProvider.publicKey.toBytes()) : "";
    },
    getAccounts: async () => (injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : []),
    getPrivateKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getSecretKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<string> => {
      const transaction = await injectedProvider.signTransaction(req.params.message);
      return transaction;
    },
    signMessage: async (req: JRPCRequest<{ data: string; from: string; display?: string }>): Promise<string> => {
      const sigData = await injectedProvider.signMessage(req.params.data, req.params.from, req.params.display as "utf8" | "hex");
      return sigData;
    },
    signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<string[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw rpcErrors.invalidParams("message");
      }
      const transaction = await injectedProvider.signAllTransactions(req.params.message);
      return transaction;
    },
    signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<string> => {
      const txRes = await injectedProvider.signAndSendTransaction(req.params.message);
      return txRes;
    },
  };
  return providerHandlers;
};
