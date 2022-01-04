import { ChainNamespaceType, getChainConfig } from "@web3auth/base";

import { CustomAuthAdapterOptions } from "./interface";

export const getCustomAuthDefaultOptions = (chainNamespace?: ChainNamespaceType, chainId?: number | string): Partial<CustomAuthAdapterOptions> => {
  return {
    adapterSettings: {
      baseUrl: "",
      redirectPathName: "",
      uxMode: "redirect",
      enableLogging: true,
      network: "mainnet",
    },
    initSettings: {
      skipInit: true,
      skipSw: true,
      skipPrefetch: true,
    },
    chainConfig: chainNamespace && chainId ? getChainConfig(chainNamespace, chainId) : undefined,
  };
};
