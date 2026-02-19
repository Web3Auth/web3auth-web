import { type GetEthCodeFn } from "@toruslabs/ethereum-controllers";
import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  mergeMiddleware,
  rpcErrors,
  SafeEventEmitterProvider,
} from "@web3auth/auth";

import { AddEthereumChainConfig } from "../../../base";
import { IEthChainSwitchHandlers, IEthProviderHandlers } from "./interfaces";
import { createWalletMiddleware } from "./walletMidddleware";

/**
 * Creates a `getEthCode` function that uses the provider engine proxy to call `eth_getCode`.
 * Implements the `GetEthCodeFn` type from `@toruslabs/ethereum-controllers`.
 */
export function createGetEthCode(getProviderEngineProxy: () => SafeEventEmitterProvider | null): GetEthCodeFn {
  return async (address: `0x${string}`, _chainId: `0x${string}`): Promise<`0x${string}`> => {
    const provider = getProviderEngineProxy();
    if (!provider) {
      throw rpcErrors.internal({ message: "Provider is not initialized" });
    }
    const code = await provider.request<[string, string], string>({
      method: "eth_getCode",
      params: [address, "latest"],
    });
    return (code || "0x") as `0x${string}`;
  };
}

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

  async function addChainConfig(req: JRPCRequest<AddEthereumChainConfig[]>, res: JRPCResponse<unknown>): Promise<void> {
    const chainConfig = req.params?.length ? req.params[0] : undefined;
    if (!chainConfig) throw rpcErrors.invalidParams("Missing chainConfig");
    res.result = await addChain(chainConfig);
  }

  return createScaffoldMiddleware({
    wallet_switchEthereumChain: createAsyncMiddleware(updateChain) as JRPCMiddleware<unknown, unknown>,
    wallet_addEthereumChain: createAsyncMiddleware(addChainConfig) as JRPCMiddleware<unknown, unknown>,
  });
}
