import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  IProvider,
  IWeb3AuthCoreOptions,
  normalizeWalletName,
  WalletInitializationError,
} from "@web3auth/base";
import { createStore as createMipd } from "mipd";

import { InjectedEvmAdapter } from "./injectedEvmAdapter";

export const getInjectedAdapters = (params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId) as CustomChainConfig),
    ...(chainConfig || {}),
  };
  // EIP-6963: multiple injected provider discovery
  const mipd = createMipd();
  // We assume that all extensions have emitted by here.
  // TODO: Ideally, we must use reactive listening. We will do that with v9
  const injectedProviders = mipd.getProviders().map((providerDetail) => {
    return new InjectedEvmAdapter({
      name: normalizeWalletName(providerDetail.info.name),
      provider: providerDetail.provider as IProvider,
      chainConfig: finalChainConfig,
      clientId,
      sessionTime,
      web3AuthNetwork,
      useCoreKitKey,
    });
  });

  return injectedProviders;
};
