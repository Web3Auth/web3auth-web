import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineV2, type MiddlewareConstraint } from "@web3auth/auth";

import type { CustomChainConfig } from "../../../base";

function createSolanaChainIdMiddlewareV2(chainId: string): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === "solana_chainId") return chainId;
    return next(request);
  };
}

function createSolanaProviderConfigMiddlewareV2(providerConfig: CustomChainConfig): MiddlewareConstraint {
  return ({ request, next }) => {
    if (request.method === "solana_provider_config") return providerConfig;
    return next(request);
  };
}

export function createSolanaJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: MiddlewareConstraint;
} {
  const { chainId, rpcTarget } = providerConfig;
  const engine = JRPCEngineV2.create({
    middleware: [
      createSolanaChainIdMiddlewareV2(chainId),
      createSolanaProviderConfigMiddlewareV2(providerConfig),
      createFetchMiddleware({ rpcTarget }),
    ],
  });
  const networkMiddleware = engine.asMiddleware();
  return { networkMiddleware };
}
