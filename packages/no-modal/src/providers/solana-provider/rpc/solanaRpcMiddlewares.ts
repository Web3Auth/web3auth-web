import { createScaffoldMiddlewareV2, type JRPCRequest, type MiddlewareConstraint, type MiddlewareParams } from "@web3auth/auth";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { ISolanaProviderHandlers } from "./interfaces";

export function createSolanaMiddleware(providerHandlers: ISolanaProviderHandlers): MiddlewareConstraint {
  const {
    getAccounts,
    requestAccounts,
    signTransaction,
    signAndSendTransaction,
    signAllTransactions,
    signMessage,
    getPrivateKey,
    getSecretKey,
    getPublicKey,
  } = providerHandlers;

  return createScaffoldMiddlewareV2({
    [SOLANA_METHOD_TYPES.SOLANA_REQUEST_ACCOUNTS]: async (params: MiddlewareParams<JRPCRequest<unknown>>) => {
      if (!requestAccounts) throw new Error("WalletMiddleware - opts.requestAccounts not provided");
      return requestAccounts(params.request);
    },
    [SOLANA_METHOD_TYPES.GET_ACCOUNTS]: async (params: MiddlewareParams<JRPCRequest<unknown>>) => {
      if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
      return getAccounts(params.request);
    },
    [SOLANA_METHOD_TYPES.SIGN_TRANSACTION]: async (params: MiddlewareParams<JRPCRequest<{ message: string }>>) => signTransaction(params.request),
    [SOLANA_METHOD_TYPES.SEND_TRANSACTION]: async (params: MiddlewareParams<JRPCRequest<{ message: string }>>) =>
      signAndSendTransaction(params.request),
    [SOLANA_METHOD_TYPES.SIGN_ALL_TRANSACTIONS]: async (params: MiddlewareParams<JRPCRequest<{ message: string[] }>>) =>
      signAllTransactions(params.request),
    [SOLANA_METHOD_TYPES.SIGN_MESSAGE]: async (params: MiddlewareParams<JRPCRequest<{ data: string; from: string; display?: string }>>) =>
      signMessage(params.request),
    [SOLANA_METHOD_TYPES.SOLANA_PRIVATE_KEY]: async (params: MiddlewareParams<JRPCRequest<unknown>>) => getPrivateKey(params.request),
    [SOLANA_METHOD_TYPES.PRIVATE_KEY]: async (params: MiddlewareParams<JRPCRequest<unknown>>) => getPrivateKey(params.request),
    public_key: async (params: MiddlewareParams<JRPCRequest<unknown>>) => getPublicKey(params.request),
    solanaPublicKey: async (params: MiddlewareParams<JRPCRequest<unknown>>) => getPublicKey(params.request),
    solanaSecretKey: async (params: MiddlewareParams<JRPCRequest<unknown>>) => getSecretKey(params.request),
  });
}
