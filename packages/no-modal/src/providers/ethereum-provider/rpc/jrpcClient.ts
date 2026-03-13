import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, JRPCRequest, type MiddlewareConstraint, MiddlewareParams } from "@web3auth/auth";

import type { CustomChainConfig } from "../../../base";

function createEthChainIdMiddleware(chainId: string): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === "eth_chainId") return chainId;
    return next(request);
  };
}

function createEthProviderConfigMiddleware(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === "eth_provider_config") return providerConfig;
    return next(request);
  };
}

export function createEthJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createEthChainIdMiddleware(chainId), createEthProviderConfigMiddleware(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
