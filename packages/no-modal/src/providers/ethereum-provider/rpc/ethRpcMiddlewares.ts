import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  mergeMiddleware,
  rpcErrors,
} from "@web3auth/auth";

import { IEthChainSwitchHandlers, IEthProviderHandlers } from "./interfaces";
import { createWalletMiddleware } from "./walletMidddleware";

export function createEthMiddleware(providerHandlers: IEthProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const {
    getAccounts,
    getPrivateKey,
    getPublicKey,
    processTransaction,
    processSignTransaction,
    processEthSignMessage,
    processTypedMessageV4,
    processPersonalMessage,
  } = providerHandlers;
  const ethMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      eth_syncing: false,
    }),
    createWalletMiddleware({
      getAccounts,
      getPrivateKey,
      getPublicKey,
      processTransaction,
      processEthSignMessage,
      processSignTransaction,
      processTypedMessageV4,
      processPersonalMessage,
    }) as JRPCMiddleware<unknown, unknown>,
  ]);
  return ethMiddleware;
}

export function createEthChainSwitchMiddleware({ switchChain }: IEthChainSwitchHandlers): JRPCMiddleware<unknown, unknown> {
  async function updateChain(req: JRPCRequest<{ chainId: string }[]>, res: JRPCResponse<unknown>): Promise<void> {
    const chainParams = req.params?.length ? req.params[0] : undefined;
    if (!chainParams) throw rpcErrors.invalidParams("Missing chainId");
    res.result = await switchChain(chainParams);
  }

  return createScaffoldMiddleware({
    wallet_switchEthereumChain: createAsyncMiddleware(updateChain) as JRPCMiddleware<unknown, unknown>,
  });
}
