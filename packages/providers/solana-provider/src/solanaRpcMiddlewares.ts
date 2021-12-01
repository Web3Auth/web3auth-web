import type { Transaction } from "@solana/web3.js";
import { InPageWalletProviderState, PROVIDER_JRPC_METHODS } from "@toruslabs/base-controllers";
import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCEngineEndCallback,
  JRPCEngineNextCallback,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  mergeMiddleware,
} from "@toruslabs/openlogin-jrpc";

export interface IProviderHandlers {
  version: string;
  requestAccounts?: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getAccounts?: (req: JRPCRequest<unknown>) => Promise<string[]>;
  signTransaction: (req: JRPCRequest<{ message: string }>) => Promise<Transaction>;
  signAllTransactions: (req: JRPCRequest<{ message: string[] }>) => Promise<Transaction[]>;
  signMessage?: (req: JRPCRequest<{ message: Uint8Array }>) => Promise<{ signature: Uint8Array }>;
  getProviderState: (
    req: JRPCRequest<[]>,
    res: JRPCResponse<InPageWalletProviderState>,
    next: JRPCEngineNextCallback,
    end: JRPCEngineEndCallback
  ) => void;
}

export function createGetAccountsMiddleware({ getAccounts }: { getAccounts: IProviderHandlers["getAccounts"] }): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== "getAccounts") return next();

    if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
    // This calls from the prefs controller
    const accounts = await getAccounts(request);
    response.result = accounts;
    return undefined;
  });
}

export function createRequestAccountsMiddleware({
  requestAccounts,
}: {
  requestAccounts: IProviderHandlers["requestAccounts"];
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== "solana_requestAccounts") return next();

    if (!requestAccounts) throw new Error("WalletMiddleware - opts.requestAccounts not provided");
    // This calls the UI login function
    const accounts = await requestAccounts(request);
    response.result = accounts;
    return undefined;
  });
}

export function createGenericJRPCMiddleware<T, U>(
  targetMethod: string,
  handler: (req: JRPCRequest<T>) => Promise<U>
): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware<T, unknown>(async (request, response, next) => {
    const { method } = request;
    if (method !== targetMethod) return next();

    if (!handler) throw new Error(`WalletMiddleware - ${targetMethod} not provided`);

    const result = await handler(request);
    if (!result) {
      return next();
    }
    response.result = result;
    return undefined;
  });
}

export function createSolanaMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const { getAccounts, requestAccounts, signTransaction, signAllTransactions, signMessage, getProviderState, version } = providerHandlers;

  return mergeMiddleware([
    createScaffoldMiddleware({
      version,
      [PROVIDER_JRPC_METHODS.GET_PROVIDER_STATE]: getProviderState,
    }),
    createRequestAccountsMiddleware({ requestAccounts }),
    createGetAccountsMiddleware({ getAccounts }),
    createGenericJRPCMiddleware<{ message: string }, Transaction>("sign_transaction", signTransaction),
    createGenericJRPCMiddleware<{ message: string[] }, Transaction[]>("sign_all_transactions", signAllTransactions),
    createGenericJRPCMiddleware<{ message: Uint8Array }, { signature: Uint8Array }>("sign_message", signMessage),
  ]);
}
