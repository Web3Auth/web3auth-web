import { createScaffoldMiddlewareV2, JRPCEngineV2, type MiddlewareConstraint, rpcErrors } from "@web3auth/auth";

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
  type ScaffoldParams = { request: { method: string; params?: unknown }; next: (r?: unknown) => Promise<unknown> };
  return createScaffoldMiddlewareV2({
    wallet_switchEthereumChain: async (params: ScaffoldParams) => {
      const request = params.request as { params?: { chainId: string }[] };
      const chainParams = request.params?.length ? request.params[0] : undefined;
      if (!chainParams) throw rpcErrors.invalidParams("Missing chainId");
      await switchChain(chainParams);
      return null;
    },
    wallet_addEthereumChain: async (params: ScaffoldParams) => {
      const request = params.request as { params?: AddEthereumChainConfig[] };
      const chainConfig = request.params?.length ? request.params[0] : undefined;
      if (!chainConfig) throw rpcErrors.invalidParams("Missing chainConfig");
      await addChain(chainConfig);
      return null;
    },
  } as Parameters<typeof createScaffoldMiddlewareV2>[0]);
}
