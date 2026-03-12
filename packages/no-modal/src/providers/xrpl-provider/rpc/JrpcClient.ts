import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, type MiddlewareConstraint } from "@web3auth/auth";

import type { CustomChainConfig } from "../../../base";
import { RPC_METHODS } from "./xrplRpcMiddlewares";

function createXrplChainIdMiddlewareV2(chainId: string): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === RPC_METHODS.CHAIN_ID) return chainId;
    return next(request);
  };
}

function createXrplProviderConfigMiddlewareV2(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === RPC_METHODS.PROVIDER_CHAIN_CONFIG) return providerConfig;
    return next(request);
  };
}

export function createXrplJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createXrplChainIdMiddlewareV2(chainId), createXrplProviderConfigMiddlewareV2(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
