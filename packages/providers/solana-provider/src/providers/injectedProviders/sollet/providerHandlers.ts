import type SolletWallet from "@project-serum/sol-wallet-adapter";
import { Connection, Transaction } from "@solana/web3.js";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { IProviderHandlers } from "../../../rpc/solanaRpcMiddlewares";

export const getSolletHandlers = (injectedProvider: SolletWallet, getProviderEngineProxy: () => SafeEventEmitterProvider): IProviderHandlers => {
  const providerHandlers: IProviderHandlers = {
    requestAccounts: async () => {
      return injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : [];
    },
    getAccounts: async () => {
      return injectedProvider.publicKey ? [bs58.encode(injectedProvider.publicKey.toBytes())] : [];
    },
    getPrivateKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },
    signTransaction: async (req: JRPCRequest<{ message: Transaction }>): Promise<Transaction> => {
      const transaction = await injectedProvider.signTransaction(req.params.message);
      return transaction;
    },
    signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
      const { signature } = await injectedProvider.sign(req.params.message, "utf8");
      return signature;
    },

    signAllTransactions: async (req: JRPCRequest<{ message: Transaction[] }>): Promise<Transaction[]> => {
      if (!req.params?.message || !req.params?.message.length) {
        throw ethErrors.rpc.invalidParams("message");
      }
      const transaction = await injectedProvider.signAllTransactions(req.params.message);
      return transaction;
    },

    signAndSendTransaction: async (req: JRPCRequest<{ message: Transaction }>): Promise<{ signature: string }> => {
      const provider = getProviderEngineProxy();
      if (!provider) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
      const transaction = await injectedProvider.signTransaction(req.params.message);
      const chainConfig = (await provider.request<CustomChainConfig>({ method: "solana_provider_config", params: [] })) as CustomChainConfig;
      const conn = new Connection(chainConfig.rpcTarget);
      const res = await conn.sendRawTransaction(transaction.serialize());
      return { signature: res };
    },
    getSecretKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },
  };
  return providerHandlers;
};
