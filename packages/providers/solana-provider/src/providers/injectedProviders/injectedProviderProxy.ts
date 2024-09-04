import { createAsyncMiddleware, JRPCEngineNextCallback, JRPCMiddleware, JRPCRequest, JRPCResponse } from "@web3auth/auth";

import { InjectedProvider } from "./interface";

export function createInjectedProviderProxyMiddleware(provider: InjectedProvider): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (req: JRPCRequest<unknown>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback) => {
    const result = await provider.request(req);
    res.result = result;
  });
}
