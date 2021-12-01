import { createAsyncMiddleware, JRPCEngineNextCallback, JRPCMiddleware, JRPCRequest, JRPCResponse } from "@toruslabs/openlogin-jrpc";

import { ISolanaWallet } from "./interface";

interface InjectedProviderOptions {
  provider: ISolanaWallet;
}
export function createInjectedProviderProxyMiddleware({ provider }: InjectedProviderOptions): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (req: JRPCRequest<unknown>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback) => {
    const result = await provider.request({
      ...req,
    });
    res.result = result;
  });
}
