import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { Block, JRPCEngineEndCallback, JRPCEngineNextCallback, JRPCMiddleware, JRPCRequest, JRPCResponse, mergeMiddleware } from "@web3auth/auth";

import { CustomChainConfig } from "@/core/base";

import { RPC_METHODS } from "./xrplRpcMiddlewares";

export function createXrplChainIdMiddleware(chainId: string): JRPCMiddleware<unknown, string> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<string>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === RPC_METHODS.CHAIN_ID) {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

export function createXrplProviderConfigMiddleware(providerConfig: CustomChainConfig): JRPCMiddleware<unknown, CustomChainConfig> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<CustomChainConfig>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === RPC_METHODS.PROVIDER_CHAIN_CONFIG) {
      res.result = providerConfig;
      return end();
    }
    return next();
  };
}

export function createConfigMiddleware(providerConfig: CustomChainConfig): JRPCMiddleware<unknown, unknown> {
  const { chainId } = providerConfig;

  return mergeMiddleware([
    createXrplChainIdMiddleware(chainId) as JRPCMiddleware<unknown, unknown>,
    createXrplProviderConfigMiddleware(providerConfig) as JRPCMiddleware<unknown, unknown>,
  ]);
}

export function createXrplJsonRpcClient(providerConfig: CustomChainConfig): {
  networkMiddleware: JRPCMiddleware<unknown, unknown>;
  fetchMiddleware: JRPCMiddleware<string[], Block>;
} {
  const { rpcTarget } = providerConfig;
  const fetchMiddleware = createFetchMiddleware({ rpcTarget });
  const networkMiddleware = mergeMiddleware([createConfigMiddleware(providerConfig), fetchMiddleware as JRPCMiddleware<unknown, unknown>]);
  return { networkMiddleware, fetchMiddleware };
}
