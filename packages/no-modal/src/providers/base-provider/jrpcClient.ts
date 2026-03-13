import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, JRPCRequest, type MiddlewareConstraint, MiddlewareParams } from "@web3auth/auth";

import type { CustomChainConfig } from "../../base";

function createChainIdMiddleware(chainId: string): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === "chainId") return chainId;
    return next(request);
  };
}

function createProviderConfigMiddleware(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === "provider_config") return providerConfig;
    return next(request);
  };
}

export function createJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createChainIdMiddleware(chainId), createProviderConfigMiddleware(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
