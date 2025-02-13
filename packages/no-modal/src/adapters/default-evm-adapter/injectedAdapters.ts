import { createStore as createMipd } from "mipd";

import { IAdapter, IProvider, IWeb3AuthCoreOptions, normalizeWalletName } from "@/core/base";

import { InjectedEvmAdapter } from "./injectedEvmAdapter";

export const getEvmInjectedAdapters = (_params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
  // EIP-6963: multiple injected provider discovery
  const mipd = createMipd();
  // We assume that all extensions have emitted by here.
  // TODO: Ideally, we must use reactive listening. We will do that with v9
  const injectedProviders = mipd.getProviders().map((providerDetail) => {
    return new InjectedEvmAdapter({ name: normalizeWalletName(providerDetail.info.name), provider: providerDetail.provider as IProvider });
  });

  return injectedProviders;
};
