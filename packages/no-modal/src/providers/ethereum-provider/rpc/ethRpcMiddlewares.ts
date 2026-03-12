import { createScaffoldMiddlewareV2, JRPCEngineV2, JRPCRequest, type MiddlewareConstraint, type MiddlewareParams, rpcErrors } from "@web3auth/auth";

import type { AddEthereumChainConfig } from "../../../base";
import type { IEthChainSwitchHandlers, IEthProviderHandlers } from "./interfaces";
import { createWalletMiddlewareV2 } from "./walletMiddleware";

export function createEthMiddleware(providerHandlers: IEthProviderHandlers): MiddlewareConstraint {
  const engine = JRPCEngineV2.create({
    middleware: [createScaffoldMiddlewareV2({ eth_syncing: false }), createWalletMiddlewareV2(providerHandlers)],
  });
  return engine.asMiddleware();
}

export function createEthChainSwitchMiddleware({ switchChain, addChain }: IEthChainSwitchHandlers): MiddlewareConstraint {
  async function walletSwitchEthereumChainHandler(params: MiddlewareParams<JRPCRequest<{ chainId: string }[]>>): Promise<null> {
    const request = params.request;
    const chainParams = request.params?.length ? request.params[0] : undefined;
    if (!chainParams) throw rpcErrors.invalidParams("Missing chainId");
    await switchChain(chainParams);
    return null;
  }

  async function walletAddEthereumChainHandler(params: MiddlewareParams<JRPCRequest<AddEthereumChainConfig[]>>): Promise<null> {
    const request = params.request;
    const chainConfig = request.params?.length ? request.params[0] : undefined;
    if (!chainConfig) throw rpcErrors.invalidParams("Missing chainConfig");
    await addChain(chainConfig);
    return null;
  }

  return createScaffoldMiddlewareV2({
    wallet_switchEthereumChain: walletSwitchEthereumChainHandler,
    wallet_addEthereumChain: walletAddEthereumChainHandler,
  });
}
