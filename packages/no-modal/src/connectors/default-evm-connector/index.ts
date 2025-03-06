import { createStore as createMipd, EIP6963ProviderDetail } from "mipd";

import { ConnectorFn } from "@/core/base";

import { injectedEvmConnector } from "./injectedEvmConnector";

export const getEvmInjectedConnectors = (): ConnectorFn[] => {
  // EIP-6963: multiple injected provider discovery
  const mipd = createMipd();
  // We assume that all extensions have emitted by here.
  // TODO: Ideally, we must use reactive listening. We will do that with v9
  return mipd.getProviders().map((providerDetail: EIP6963ProviderDetail) => injectedEvmConnector(providerDetail));
};

export { createMipd, injectedEvmConnector };
