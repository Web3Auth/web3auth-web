import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  mergeMiddleware,
  rpcErrors,
} from "@web3auth/auth";

import { CustomChainConfig } from "../../../base";
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

export function createEthChainSwitchMiddleware({ switchChain, addChain }: IEthChainSwitchHandlers): JRPCMiddleware<unknown, unknown> {
  async function updateChain(req: JRPCRequest<{ chainId: string }[]>, res: JRPCResponse<unknown>): Promise<void> {
    const chainParams = req.params?.length ? req.params[0] : undefined;
    if (!chainParams) throw rpcErrors.invalidParams("Missing chainId");
    res.result = await switchChain(chainParams);
  }

  async function addChainConfig(req: JRPCRequest<{ chainConfig: CustomChainConfig }[]>, res: JRPCResponse<unknown>): Promise<void> {
    const chainConfig = req.params?.length ? req.params[0] : undefined;
    if (!chainConfig) throw rpcErrors.invalidParams("Missing chainConfig");
    res.result = await addChain(chainConfig);
  }

  return createScaffoldMiddleware({
    wallet_switchEthereumChain: createAsyncMiddleware(updateChain) as JRPCMiddleware<unknown, unknown>,
    wallet_addEthereumChain: createAsyncMiddleware(addChainConfig) as JRPCMiddleware<unknown, unknown>,
  });
}
