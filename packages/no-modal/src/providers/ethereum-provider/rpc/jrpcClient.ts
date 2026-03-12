import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, type MiddlewareConstraint } from "@web3auth/auth";

import type { CustomChainConfig } from "../../../base";

function createEthChainIdMiddlewareV2(chainId: string): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === "eth_chainId") return chainId;
    return next(request);
  };
}

function createEthProviderConfigMiddlewareV2(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === "eth_provider_config") return providerConfig;
    return next(request);
  };
}

export function createEthJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createEthChainIdMiddlewareV2(chainId), createEthProviderConfigMiddlewareV2(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
