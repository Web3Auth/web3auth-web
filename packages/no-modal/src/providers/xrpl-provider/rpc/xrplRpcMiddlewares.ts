import { randomId } from "@toruslabs/base-controllers";
import {
  createScaffoldMiddlewareV2,
  JRPCEngineV2,
  type JRPCRequest,
  type Json,
  type MiddlewareConstraint,
  type MiddlewareParams,
  rpcErrors,
} from "@web3auth/auth";
import type { SubmitResponse, Transaction } from "xrpl";

export const RPC_METHODS = {
  GET_ACCOUNTS: "xrpl_getAccounts",
  GET_KEY_PAIR: "xrpl_getKeyPair",
  GET_PUBLIC_KEY: "xrpl_getPublicKey",
  SIGN_MESSAGE: "xrpl_signMessage",
  SIGN_TRANSACTION: "xrpl_signTransaction",
  SUBMIT_TRANSACTION: "xrpl_submitTransaction",
  ADD_CHAIN: "xrpl_addChain",
  SWITCH_CHAIN: "xrpl_switchChain",
  CHAIN_ID: "xrpl_chainId",
  PROVIDER_CHAIN_CONFIG: "xrpl_providerChainConfig",
};

export type KeyPair = { publicKey: string; privateKey: string };
export interface IXrplProviderHandlers {
  getAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getKeyPair: (req: JRPCRequest<unknown>) => Promise<KeyPair>;
  getPublicKey: (req: JRPCRequest<unknown>) => Promise<string>;
  signTransaction: (req: JRPCRequest<{ transaction: Transaction; multisign: string | boolean }>) => Promise<{ tx_blob: string; hash: string }>;
  submitTransaction: (req: JRPCRequest<{ transaction: Transaction }>) => Promise<SubmitResponse>;
  signMessage: (req: JRPCRequest<{ message: string }>) => Promise<{ signature: string }>;
}

/** Normalizes request.id for XRPL servers that don't support large IDs from fetch middleware. */
function createRequestIdNormalizerMiddleware(): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    (request as { id?: string }).id = randomId();
    return next(request);
  };
}

export function createXRPLMiddleware(providerHandlers: IXrplProviderHandlers): MiddlewareConstraint {
  const { getAccounts, submitTransaction, signTransaction, signMessage, getKeyPair, getPublicKey } = providerHandlers;

  const scaffold = createScaffoldMiddlewareV2({
    [RPC_METHODS.GET_ACCOUNTS]: (params: MiddlewareParams<JRPCRequest<unknown>>) => {
      if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
      return getAccounts(params.request);
    },
    [RPC_METHODS.SIGN_TRANSACTION]: (params: MiddlewareParams<JRPCRequest<{ transaction: Transaction; multisign: string | boolean }>>) => {
      return signTransaction(params.request);
    },
    [RPC_METHODS.SUBMIT_TRANSACTION]: (params: MiddlewareParams<JRPCRequest<{ transaction: Transaction }>>): Promise<Readonly<Json>> => {
      return submitTransaction(params.request) as unknown as Promise<Readonly<Json>>;
    },
    [RPC_METHODS.SIGN_MESSAGE]: (params: MiddlewareParams<JRPCRequest<{ message: string }>>) => {
      return signMessage(params.request);
    },
    [RPC_METHODS.GET_KEY_PAIR]: (params: MiddlewareParams<JRPCRequest<unknown>>) => {
      return getKeyPair(params.request);
    },
    [RPC_METHODS.GET_PUBLIC_KEY]: (params: MiddlewareParams<JRPCRequest<unknown>>) => {
      return getPublicKey(params.request);
    },
  });

  const engine = JRPCEngineV2.create({
    middleware: [createRequestIdNormalizerMiddleware(), scaffold],
  });
  return engine.asMiddleware();
}

export function creatXrplChainSwitchMiddleware(switchChain: (parrams: { chainId: string }) => Promise<void>): MiddlewareConstraint {
  async function switchChainHandler(params: MiddlewareParams<JRPCRequest<{ chainId: string }>>): Promise<undefined> {
    const req = params.request;
    if (!req.params) throw rpcErrors.invalidParams("Missing request params");
    if (!req.params.chainId) throw rpcErrors.invalidParams("Missing chainId");
    await switchChain({ chainId: req.params.chainId });
    return undefined;
  }

  return createScaffoldMiddlewareV2({
    [RPC_METHODS.SWITCH_CHAIN]: switchChainHandler,
  });
}
