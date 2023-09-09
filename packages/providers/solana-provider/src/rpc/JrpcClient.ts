import { createFetchMiddleware } from "@toruslabs/base-controllers";
import {
  Block,
  JRPCEngineEndCallback,
  JRPCEngineNextCallback,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  mergeMiddleware,
} from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig } from "@web3auth/base";

export function createChainIdMiddleware(chainId: string): JRPCMiddleware<unknown, string> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<string>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === "solana_chainId") {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

export function createProviderConfigMiddleware(
  providerConfig: Omit<CustomChainConfig, "chainNamespace">
): JRPCMiddleware<unknown, Omit<CustomChainConfig, "chainNamespace">> {
  return (
    req: JRPCRequest<unknown>,
    res: JRPCResponse<Omit<CustomChainConfig, "chainNamespace">>,
    next: JRPCEngineNextCallback,
    end: JRPCEngineEndCallback
  ) => {
    if (req.method === "solana_provider_config") {
      res.result = providerConfig;
      return end();
    }
    return next();
  };
}

export function createConfigMiddleware(providerConfig: Omit<CustomChainConfig, "chainNamespace">): JRPCMiddleware<unknown, unknown> {
  const { chainId } = providerConfig;

  return mergeMiddleware([
    createChainIdMiddleware(chainId) as JRPCMiddleware<unknown, unknown>,
    createProviderConfigMiddleware(providerConfig) as JRPCMiddleware<unknown, unknown>,
  ]);
}

export function createJsonRpcClient(providerConfig: Omit<CustomChainConfig, "chainNamespace">): {
  networkMiddleware: JRPCMiddleware<unknown, unknown>;
  fetchMiddleware: JRPCMiddleware<string[], Block>;
} {
  const { rpcTarget } = providerConfig;
  const fetchMiddleware = createFetchMiddleware({ rpcTarget });
  const networkMiddleware = mergeMiddleware([createConfigMiddleware(providerConfig), fetchMiddleware as JRPCMiddleware<unknown, unknown>]);
  return { networkMiddleware, fetchMiddleware };
}
