import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { Block, JRPCEngineEndCallback, JRPCEngineNextCallback, JRPCMiddleware, JRPCRequest, JRPCResponse, mergeMiddleware } from "@web3auth/auth";

import { CustomChainConfig } from "../../../base";

export function createSolanaChainIdMiddleware(chainId: string): JRPCMiddleware<unknown, string> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<string>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === "solana_chainId") {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

export function createSolanaProviderConfigMiddleware(providerConfig: CustomChainConfig): JRPCMiddleware<unknown, CustomChainConfig> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<CustomChainConfig>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === "solana_provider_config") {
      res.result = providerConfig;
      return end();
    }
    return next();
  };
}

export function createConfigMiddleware(providerConfig: CustomChainConfig): JRPCMiddleware<unknown, unknown> {
  const { chainId } = providerConfig;

  return mergeMiddleware([
    createSolanaChainIdMiddleware(chainId) as JRPCMiddleware<unknown, unknown>,
    createSolanaProviderConfigMiddleware(providerConfig) as JRPCMiddleware<unknown, unknown>,
  ]);
}

export function createSolanaJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: JRPCMiddleware<unknown, unknown>;
  fetchMiddleware: JRPCMiddleware<string[], Block>;
} {
  const { rpcTarget } = providerConfig;
  const fetchMiddleware = createFetchMiddleware({ rpcTarget });
  const networkMiddleware = mergeMiddleware([createConfigMiddleware(providerConfig), fetchMiddleware as JRPCMiddleware<unknown, unknown>]);
  return { networkMiddleware, fetchMiddleware };
}
