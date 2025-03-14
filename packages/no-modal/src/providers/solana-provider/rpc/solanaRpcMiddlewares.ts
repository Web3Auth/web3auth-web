import { createAsyncMiddleware, JRPCMiddleware, JRPCRequest, mergeMiddleware } from "@web3auth/auth";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { ISolanaChainSwitchHandlers, ISolanaProviderHandlers } from "./interfaces";

export function createGetAccountsMiddleware({
  getAccounts,
}: {
  getAccounts: ISolanaProviderHandlers["getAccounts"];
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== SOLANA_METHOD_TYPES.GET_ACCOUNTS) return next();

    if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
    // This calls from the prefs controller
    const accounts = await getAccounts(request);
    response.result = accounts;
    return undefined;
  });
}

export function createGetPublicKeyMiddleware({
  getPublicKey,
}: {
  getPublicKey: ISolanaProviderHandlers["getPublicKey"];
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== "getPublicKey") return next();

    if (!getPublicKey) throw new Error("WalletMiddleware - opts.getPublicKey not provided");
    const publicKey = await getPublicKey(request);
    response.result = publicKey;
    return undefined;
  });
}

export function createRequestAccountsMiddleware({
  requestAccounts,
}: {
  requestAccounts: ISolanaProviderHandlers["requestAccounts"];
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== SOLANA_METHOD_TYPES.SOLANA_REQUEST_ACCOUNTS) return next();

    if (!requestAccounts) throw new Error("WalletMiddleware - opts.requestAccounts not provided");
    // This calls the UI login function
    const accounts = await requestAccounts(request);
    response.result = accounts;
    return undefined;
  });
}

export function createGenericJRPCMiddleware<T, U>(targetMethod: string, handler: (req: JRPCRequest<T>) => Promise<U>): JRPCMiddleware<T, U> {
  return createAsyncMiddleware<T, U>(async (request, response, next) => {
    const { method } = request;
    if (method !== targetMethod) return next();

    if (!handler) throw new Error(`WalletMiddleware - ${targetMethod} not provided`);

    const result = await handler(request);

    response.result = result;
    return undefined;
  });
}

export function createSolanaMiddleware(providerHandlers: ISolanaProviderHandlers): JRPCMiddleware<unknown, unknown> {
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

  return mergeMiddleware([
    createRequestAccountsMiddleware({ requestAccounts }),
    createGetAccountsMiddleware({ getAccounts }),
    createGenericJRPCMiddleware<{ message: string }, string>(SOLANA_METHOD_TYPES.SIGN_TRANSACTION, signTransaction) as JRPCMiddleware<
      unknown,
      unknown
    >,
    createGenericJRPCMiddleware<{ message: string }, string>(SOLANA_METHOD_TYPES.SEND_TRANSACTION, signAndSendTransaction) as JRPCMiddleware<
      unknown,
      unknown
    >,
    createGenericJRPCMiddleware<{ message: string[] }, string[]>(SOLANA_METHOD_TYPES.SIGN_ALL_TRANSACTIONS, signAllTransactions) as JRPCMiddleware<
      unknown,
      unknown
    >,
    createGenericJRPCMiddleware<{ data: string; from: string }, string>(SOLANA_METHOD_TYPES.SIGN_MESSAGE, signMessage) as JRPCMiddleware<
      unknown,
      unknown
    >,
    createGenericJRPCMiddleware<void, string>("solanaPrivateKey", getPrivateKey) as JRPCMiddleware<unknown, unknown>,
    createGenericJRPCMiddleware<void, string>("private_key", getPrivateKey) as JRPCMiddleware<unknown, unknown>,
    createGenericJRPCMiddleware<void, string>("public_key", getPublicKey) as JRPCMiddleware<unknown, unknown>,
    createGenericJRPCMiddleware<void, string>("solanaPublicKey", getPublicKey) as JRPCMiddleware<unknown, unknown>,
    createGenericJRPCMiddleware<void, string>("solanaSecretKey", getSecretKey) as JRPCMiddleware<unknown, unknown>,
  ]);
}

export function createSolanaChainSwitchMiddleware({ switchSolanaChain }: ISolanaChainSwitchHandlers): JRPCMiddleware<unknown, unknown> {
  return mergeMiddleware([
    createGenericJRPCMiddleware<{ chainId: string }, void>("switchSolanaChain", switchSolanaChain) as JRPCMiddleware<unknown, unknown>,
  ]);
}

export interface ISolanaAccountHandlers {
  updatePrivatekey: (req: JRPCRequest<{ privateKey: string }>) => Promise<void>;
}
export function createSolanaAccountMiddleware({ updatePrivatekey }: ISolanaAccountHandlers): JRPCMiddleware<unknown, unknown> {
  return mergeMiddleware([
    createGenericJRPCMiddleware<{ privateKey: string }, void>("updateAccount", updatePrivatekey) as JRPCMiddleware<unknown, unknown>,
  ]);
}
