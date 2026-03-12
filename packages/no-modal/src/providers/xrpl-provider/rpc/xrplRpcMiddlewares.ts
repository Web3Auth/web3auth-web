import { randomId } from "@toruslabs/base-controllers";
import { createScaffoldMiddlewareV2, JRPCEngineV2, type JRPCRequest, type MiddlewareConstraint, rpcErrors } from "@web3auth/auth";
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
  return ({ request, next }) => {
    (request as { id?: string }).id = randomId();
    return next(request);
  };
}

type ScaffoldParams = { request: JRPCRequest<unknown>; next: (r?: unknown) => Promise<unknown> };

export function createXRPLMiddleware(providerHandlers: IXrplProviderHandlers): MiddlewareConstraint {
  const { getAccounts, submitTransaction, signTransaction, signMessage, getKeyPair, getPublicKey } = providerHandlers;

  const scaffold = createScaffoldMiddlewareV2({
    [RPC_METHODS.GET_ACCOUNTS]: async (params: ScaffoldParams) => {
      if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
      return getAccounts(params.request);
    },
    [RPC_METHODS.SIGN_TRANSACTION]: async (params: ScaffoldParams) =>
      signTransaction(params.request as JRPCRequest<{ transaction: Transaction; multisign: string | boolean }>),
    [RPC_METHODS.SUBMIT_TRANSACTION]: async (params: ScaffoldParams) =>
      submitTransaction(params.request as JRPCRequest<{ transaction: Transaction }>),
    [RPC_METHODS.SIGN_MESSAGE]: async (params: ScaffoldParams) => signMessage(params.request as JRPCRequest<{ message: string }>),
    [RPC_METHODS.GET_KEY_PAIR]: async (params: ScaffoldParams) => getKeyPair(params.request),
    [RPC_METHODS.GET_PUBLIC_KEY]: async (params: ScaffoldParams) => getPublicKey(params.request),
  } as Parameters<typeof createScaffoldMiddlewareV2>[0]);

  const engine = JRPCEngineV2.create({
    middleware: [createRequestIdNormalizerMiddleware(), scaffold],
  });
  return engine.asMiddleware();
}

export interface IXrplChainSwitchHandlers {
  switchChain: (req: JRPCRequest<{ chainId: string }>) => Promise<void>;
}

export function creatXrplChainSwitchMiddleware({ switchChain }: IXrplChainSwitchHandlers): MiddlewareConstraint {
  return createScaffoldMiddlewareV2({
    [RPC_METHODS.SWITCH_CHAIN]: async (params: ScaffoldParams) => {
      const req = params.request as JRPCRequest<{ chainId: string }>;
      if (!req.params) throw rpcErrors.invalidParams("Missing request params");
      if (!req.params.chainId) throw rpcErrors.invalidParams("Missing chainId");
      await switchChain(req);
      return undefined;
    },
  } as Parameters<typeof createScaffoldMiddlewareV2>[0]);
}
