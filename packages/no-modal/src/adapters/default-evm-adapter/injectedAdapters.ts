import { createStore as createMipd } from "mipd";

import { AdapterFn, AdapterParams, CHAIN_NAMESPACES, IProvider, normalizeWalletName, WalletInitializationError } from "@/core/base";

import { injectedEvmAdapter } from "./injectedEvmAdapter";

export const getEvmInjectedAdapters = ({ options }: AdapterParams): AdapterFn[] => {
  const { chainConfig } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  // EIP-6963: multiple injected provider discovery
  const mipd = createMipd();
  // We assume that all extensions have emitted by here.
  // TODO: Ideally, we must use reactive listening. We will do that with v9
  const injectedProviders = mipd.getProviders().map((providerDetail) => {
    return injectedEvmAdapter({
      name: normalizeWalletName(providerDetail.info.name),
      provider: providerDetail.provider as IProvider,
    });
  });

  return injectedProviders;
};
