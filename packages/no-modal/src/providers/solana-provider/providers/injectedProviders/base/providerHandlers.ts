import { getBase58Decoder } from "@solana/kit";
import { JRPCRequest, rpcErrors } from "@web3auth/auth";

import { IBaseWalletProvider } from "../../../interface";
import { ISolanaProviderHandlers } from "../../../rpc";

// Base58 decoder: bytes → base58 string
const base58Decoder = getBase58Decoder();

export const getBaseProviderHandlers = (injectedProvider: IBaseWalletProvider): ISolanaProviderHandlers => {
  const providerHandlers: ISolanaProviderHandlers = {
    requestAccounts: async () => {
      return injectedProvider.publicKey ? [base58Decoder.decode(injectedProvider.publicKey.toBytes())] : [];
    },
    getPublicKey: async () => {
      return injectedProvider.publicKey ? base58Decoder.decode(injectedProvider.publicKey.toBytes()) : "";
    },
    getAccounts: async () => (injectedProvider.publicKey ? [base58Decoder.decode(injectedProvider.publicKey.toBytes())] : []),
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
