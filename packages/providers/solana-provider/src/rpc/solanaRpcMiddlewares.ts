import type { Transaction } from "@solana/web3.js";
import { createAsyncMiddleware, JRPCMiddleware, JRPCRequest, mergeMiddleware } from "@toruslabs/openlogin-jrpc";

export interface IProviderHandlers {
  requestAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getPrivateKey: (req: JRPCRequest<unknown>) => Promise<string>;
  signTransaction: (req: JRPCRequest<{ message: string }>) => Promise<Transaction>;
  signAllTransactions: (req: JRPCRequest<{ message: string[] }>) => Promise<Transaction[]>;
  signAndSendTransaction: (req: JRPCRequest<{ message: string }>) => Promise<{ signature: string }>;
  signMessage: (req: JRPCRequest<{ message: Uint8Array }>) => Promise<Uint8Array>;
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
    if (method !== "requestAccounts") return next();

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

    response.result = result;
    return undefined;
  });
}

export function createSolanaMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const { getAccounts, requestAccounts, signTransaction, signAndSendTransaction, signAllTransactions, signMessage, getPrivateKey } = providerHandlers;

  return mergeMiddleware([
    createRequestAccountsMiddleware({ requestAccounts }),
    createGetAccountsMiddleware({ getAccounts }),
    createGenericJRPCMiddleware<{ message: string }, Transaction>("signTransaction", signTransaction),
    createGenericJRPCMiddleware<{ message: string }, { signature: string }>("signAndSendTransaction", signAndSendTransaction),
    createGenericJRPCMiddleware<{ message: string[] }, Transaction[]>("signAllTransactions", signAllTransactions),
    createGenericJRPCMiddleware<{ message: Uint8Array }, Uint8Array>("signMessage", signMessage),
    createGenericJRPCMiddleware<void, string>("solanaPrivateKey", getPrivateKey),
  ]);
}
export interface AddSolanaChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export interface IChainSwitchHandlers {
  addNewChainConfig: (req: JRPCRequest<AddSolanaChainParameter>) => Promise<void>;
  switchSolanaChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}
export function createChainSwitchMiddleware({ addNewChainConfig, switchSolanaChain }: IChainSwitchHandlers): JRPCMiddleware<unknown, unknown> {
  return mergeMiddleware([
    createGenericJRPCMiddleware<AddSolanaChainParameter, void>("addSolanaChain", addNewChainConfig),
    createGenericJRPCMiddleware<{ chainId: string }, void>("switchSolanaChain", switchSolanaChain),
  ]);
}

export interface IAccountHandlers {
  updatePrivatekey: (req: JRPCRequest<{ privateKey: string }>) => Promise<void>;
}
export function createAccountMiddleware({ updatePrivatekey }: IAccountHandlers): JRPCMiddleware<unknown, unknown> {
  return mergeMiddleware([createGenericJRPCMiddleware<{ privateKey: string }, void>("updateAccount", updatePrivatekey)]);
}
