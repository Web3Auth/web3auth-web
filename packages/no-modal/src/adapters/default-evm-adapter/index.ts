import { AdapterFn, AdapterParams, CHAIN_NAMESPACES, WalletInitializationError } from "@/core/base";
import { walletConnectV2Adapter } from "@/core/wallet-connect-v2-adapter";

import { getEvmInjectedAdapters } from "./injectedAdapters";

export const getEvmDefaultExternalAdapters = (params: AdapterParams): AdapterFn[] => {
  const { options } = params;
  const { chainConfig } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);

  const injectedProviders = getEvmInjectedAdapters(params);

  return [...injectedProviders, walletConnectV2Adapter()];
};

export { getEvmInjectedAdapters };
