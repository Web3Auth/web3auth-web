import { createScaffoldMiddlewareV2, type JRPCRequest, type MiddlewareConstraint } from "@web3auth/auth";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { ISolanaProviderHandlers } from "./interfaces";

type ScaffoldParams<T> = { request: JRPCRequest<T>; next: (r?: unknown) => Promise<unknown> };

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
    [SOLANA_METHOD_TYPES.SOLANA_REQUEST_ACCOUNTS]: async (params: ScaffoldParams<void>) => {
      if (!requestAccounts) throw new Error("WalletMiddleware - opts.requestAccounts not provided");
      return requestAccounts(params.request);
    },
    [SOLANA_METHOD_TYPES.GET_ACCOUNTS]: async (params: ScaffoldParams<void>) => {
      if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
      return getAccounts(params.request);
    },
    [SOLANA_METHOD_TYPES.SIGN_TRANSACTION]: async (params: ScaffoldParams<{ message: string }>) => signTransaction(params.request),
    [SOLANA_METHOD_TYPES.SEND_TRANSACTION]: async (params: ScaffoldParams<{ message: string }>) => signAndSendTransaction(params.request),
    [SOLANA_METHOD_TYPES.SIGN_ALL_TRANSACTIONS]: async (params: ScaffoldParams<{ message: string[] }>) => signAllTransactions(params.request),
    [SOLANA_METHOD_TYPES.SIGN_MESSAGE]: async (params: ScaffoldParams<{ data: string; from: string; display?: string }>) =>
      signMessage(params.request),
    [SOLANA_METHOD_TYPES.SOLANA_PRIVATE_KEY]: async (params: ScaffoldParams<void>) => getPrivateKey(params.request),
    [SOLANA_METHOD_TYPES.PRIVATE_KEY]: async (params: ScaffoldParams<void>) => getPrivateKey(params.request),
    public_key: async (params: ScaffoldParams<void>) => getPublicKey(params.request),
    solanaPublicKey: async (params: ScaffoldParams<void>) => getPublicKey(params.request),
    solanaSecretKey: async (params: ScaffoldParams<void>) => getSecretKey(params.request),
  });
}
