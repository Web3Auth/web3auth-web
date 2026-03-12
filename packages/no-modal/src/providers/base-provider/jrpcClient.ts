import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, type MiddlewareConstraint } from "@web3auth/auth";

import type { CustomChainConfig } from "../../base";

function createChainIdMiddlewareV2(chainId: string): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === "chainId") return chainId;
    return next(request);
  };
}

function createProviderConfigMiddlewareV2(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === "provider_config") return providerConfig;
    return next(request);
  };
}

export function createJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createChainIdMiddlewareV2(chainId), createProviderConfigMiddlewareV2(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
