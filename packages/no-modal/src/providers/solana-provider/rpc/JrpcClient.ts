import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, JRPCRequest, type MiddlewareConstraint, MiddlewareParams } from "@web3auth/auth";

import type { CustomChainConfig } from "../../../base";

function createSolanaChainIdMiddleware(chainId: string): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === "solana_chainId") return chainId;
    return next(request);
  };
}

function createSolanaProviderConfigMiddleware(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }: MiddlewareParams<JRPCRequest<unknown>>) => {
    if (request.method === "solana_provider_config") return providerConfig;
    return next(request);
  };
}

export function createSolanaJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [createSolanaChainIdMiddleware(chainId), createSolanaProviderConfigMiddleware(providerConfig), createFetchMiddleware({ rpcTarget })],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
