import { AdapterFn } from "@/core/base";
import { walletConnectV2Adapter } from "@/core/wallet-connect-v2-adapter";

import { getEvmInjectedAdapters } from "./injectedAdapters";

export const getEvmDefaultExternalAdapters = (): AdapterFn[] => {
  const injectedProviders = getEvmInjectedAdapters();

  return [...injectedProviders, walletConnectV2Adapter()];
};

export { getEvmInjectedAdapters };
