import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, JRPCRequest, type MiddlewareConstraint, MiddlewareParams } from "@web3auth/auth";

import type { CustomChainConfig } from "../../../base";
import { RPC_METHODS } from "./xrplRpcMiddlewares";

function createXrplChainIdMiddleware(chainId: string): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === RPC_METHODS.CHAIN_ID) return chainId;
    return next(request);
  };
}

function createXrplProviderConfigMiddleware(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === RPC_METHODS.PROVIDER_CHAIN_CONFIG) return providerConfig;
    return next(request);
  };
}

export function createXrplJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createXrplChainIdMiddleware(chainId), createXrplProviderConfigMiddleware(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
