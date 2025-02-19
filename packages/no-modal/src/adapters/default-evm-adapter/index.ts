import { createStore as createMipd } from "mipd";

import { AdapterFn, IProvider, normalizeWalletName } from "@/core/base";

import { injectedEvmAdapter } from "./injectedEvmAdapter";

export const getEvmInjectedAdapters = (): AdapterFn[] => {
  // EIP-6963: multiple injected provider discovery
  const mipd = createMipd();
  // We assume that all extensions have emitted by here.
  // TODO: Ideally, we must use reactive listening. We will do that with v9
  const injectedProviders = mipd.getProviders().map((providerDetail) => {
    return injectedEvmAdapter({ name: normalizeWalletName(providerDetail.info.name), provider: providerDetail.provider as IProvider });
  });

  return injectedProviders;
};

export { injectedEvmAdapter };
