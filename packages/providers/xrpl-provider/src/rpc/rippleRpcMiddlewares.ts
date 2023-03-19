import { createAsyncMiddleware, JRPCMiddleware, JRPCRequest, mergeMiddleware } from "@toruslabs/openlogin-jrpc";
import { SubmitResponse, Transaction } from "xrpl";

export const RPC_METHODS = {
  GET_ACCOUNTS: "ripple_getAccounts",
  GET_KEY_PAIR: "ripple_getKeyPair",
  GET_PUBLIC_KEY: "ripple_getPublicKey",
  SIGN_MESSAGE: "ripple_signTransaction",
  SIGN_TRANSACTION: "ripple_submitTransaction",
  SUBMIT_TRANSACTION: "ripple_submitMessage",
  ADD_CHAIN: "ripple_addChain",
  SWITCH_CHAIN: "ripple_switchChain",
  CHAIN_ID: "ripple_chainId",
  PROVIDER_CHAIN_CONFIG: "ripple_providerChainConfig",
};

export type KeyPair = { publicKey: string; privateKey: string };
export interface IProviderHandlers {
  getAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getKeyPair: (req: JRPCRequest<unknown>) => Promise<KeyPair>;
  getPublicKey: (req: JRPCRequest<unknown>) => Promise<string>;
  signTransaction: (req: JRPCRequest<{ transaction: Transaction; multisign: string | boolean }>) => Promise<{ tx_blob: string; hash: string }>;
  submitTransaction: (req: JRPCRequest<{ transaction: Transaction }>) => Promise<SubmitResponse>;
  signMessage: (req: JRPCRequest<{ message: string }>) => Promise<{ signature: string }>;
}

export function createGetAccountsMiddleware({ getAccounts }: { getAccounts: IProviderHandlers["getAccounts"] }): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== RPC_METHODS.GET_ACCOUNTS) return next();

    if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
    // This calls from the prefs controller
    const accounts = await getAccounts(request);
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

export function createXRPLMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const { getAccounts, submitTransaction, signTransaction, signMessage, getKeyPair, getPublicKey } = providerHandlers;

  return mergeMiddleware([
    createGetAccountsMiddleware({ getAccounts }),
    createGenericJRPCMiddleware<{ transaction: Transaction; multisign: string | boolean }, { tx_blob: string; hash: string }>(
      RPC_METHODS.SIGN_TRANSACTION,
      signTransaction
    ),
    createGenericJRPCMiddleware<{ transaction: Transaction }, SubmitResponse>(RPC_METHODS.SUBMIT_TRANSACTION, submitTransaction),
    createGenericJRPCMiddleware<{ message: string }, { signature: string }>(RPC_METHODS.SIGN_MESSAGE, signMessage),
    createGenericJRPCMiddleware<void, KeyPair>(RPC_METHODS.GET_KEY_PAIR, getKeyPair),
    createGenericJRPCMiddleware<void, string>(RPC_METHODS.GET_PUBLIC_KEY, getPublicKey),
  ]);
}

export interface AddXRPLChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export interface IChainSwitchHandlers {
  addChainConfig: (req: JRPCRequest<AddXRPLChainParameter>) => Promise<void>;
  switchChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}
export function createChainSwitchMiddleware({ addChainConfig, switchChain }: IChainSwitchHandlers): JRPCMiddleware<unknown, unknown> {
  return mergeMiddleware([
    createGenericJRPCMiddleware<AddXRPLChainParameter, void>(RPC_METHODS.ADD_CHAIN, addChainConfig),
    createGenericJRPCMiddleware<{ chainId: string }, void>(RPC_METHODS.SWITCH_CHAIN, switchChain),
  ]);
}
