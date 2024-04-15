import { rpcErrors } from "@metamask/rpc-errors";
import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse } from "@toruslabs/openlogin-jrpc";

import { IAccountHandlers } from "./interfaces";

// #region account middlewares
export function createAccountMiddleware({ updatePrivatekey }: IAccountHandlers): JRPCMiddleware<unknown, unknown> {
  async function updateAccount(req: JRPCRequest<{ privateKey: string }[]>, res: JRPCResponse<unknown>): Promise<void> {
    const accountParams = req.params?.length ? req.params[0] : undefined;
    if (!accountParams?.privateKey) throw rpcErrors.invalidParams("Missing privateKey");
    res.result = await updatePrivatekey(accountParams);
  }

  return createScaffoldMiddleware({
    wallet_updateAccount: createAsyncMiddleware(updateAccount) as JRPCMiddleware<unknown, unknown>,
  });
}

// #endregion account middlewares
