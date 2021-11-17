import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngineEndCallback, JRPCEngineNextCallback, JRPCMiddleware, JRPCRequest, JRPCResponse, mergeMiddleware } from "@toruslabs/openlogin-jrpc";
import { TorusSolanaWalletChainConfig } from "@web3auth/base";
export function createChainIdMiddleware(chainId: string): JRPCMiddleware<unknown, unknown> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<string>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === "solana_chainId") {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

export function createProviderConfigMiddleware(providerConfig: TorusSolanaWalletChainConfig): JRPCMiddleware<unknown, unknown> {
  return (req: JRPCRequest<unknown>, res: JRPCResponse<TorusSolanaWalletChainConfig>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => {
    if (req.method === "solana_provider_config") {
      res.result = providerConfig;
      return end();
    }
    return next();
  };
}

export function createJsonRpcClient(providerConfig: TorusSolanaWalletChainConfig): {
  networkMiddleware: JRPCMiddleware<unknown, unknown>;
} {
  const { chainId, rpcTarget } = providerConfig;
  const fetchMiddleware = createFetchMiddleware({ rpcTarget });

  const networkMiddleware = mergeMiddleware([createChainIdMiddleware(chainId), createProviderConfigMiddleware(providerConfig), fetchMiddleware]);
  return { networkMiddleware };
}
