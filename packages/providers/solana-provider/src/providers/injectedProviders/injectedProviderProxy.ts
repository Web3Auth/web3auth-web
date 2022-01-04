import { createAsyncMiddleware, JRPCEngineNextCallback, JRPCMiddleware, JRPCRequest, JRPCResponse } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth/base";

export interface InjectedProvider {
  request<T>(args: RequestArguments): Promise<T>;
}

export function createInjectedProviderProxyMiddleware(provider: InjectedProvider): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware(async (req: JRPCRequest<unknown[]>, res: JRPCResponse<unknown>, _next: JRPCEngineNextCallback) => {
    const result = await provider.request({
      ...req,
    });
    res.result = result;
  });
}
