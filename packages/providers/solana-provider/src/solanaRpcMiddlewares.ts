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

export interface Ihandler<T> extends JRPCRequest<T> {
  origin?: string;
  windowId?: string;
}

export interface IProviderHandlers {
  version: string;
  requestAccounts?: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getAccounts?: (req: JRPCRequest<unknown>) => Promise<string[]>;

  signMessage?: (req: Ihandler<{ data: Uint8Array; display: string }>) => Promise<unknown>;
  sendTransaction?: (req: Ihandler<{ message: string }>) => Promise<unknown>;
  signTransaction?: (req: Ihandler<{ message: string }>) => Promise<unknown>;
  signAllTransactions?: (req: Ihandler<{ message: string[] }>) => Promise<unknown>;
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

export function createGenericJRPCMiddleware<T>(
  targetMethod: string,
  handler: (req: Ihandler<T>) => Promise<unknown>
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
  const { getAccounts, requestAccounts, sendTransaction, signTransaction, signAllTransactions, signMessage, getProviderState, version } =
    providerHandlers;

  return mergeMiddleware([
    createScaffoldMiddleware({
      version,
      [PROVIDER_JRPC_METHODS.GET_PROVIDER_STATE]: getProviderState,
    }),
    createRequestAccountsMiddleware({ requestAccounts }),
    createGetAccountsMiddleware({ getAccounts }),
    createGenericJRPCMiddleware<{ message: string }>("send_transaction", sendTransaction),
    createGenericJRPCMiddleware<{ message: string }>("sign_transaction", signTransaction),
    createGenericJRPCMiddleware<{ message: string[] }>("sign_all_transactions", signAllTransactions),
    createGenericJRPCMiddleware<{ data: Uint8Array; display: string }>("sign_message", signMessage),
  ]);
}
