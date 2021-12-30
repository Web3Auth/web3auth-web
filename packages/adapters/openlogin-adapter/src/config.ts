import { ChainNamespaceType, getChainConfig } from "@web3auth/base";

import { OpenloginAdapterOptions } from "./interface";

export const getOpenloginDefaultOptions = (chainNamespace?: ChainNamespaceType, chainId?: number | string): Partial<OpenloginAdapterOptions> => {
  return {
    adapterSettings: {
      network: "mainnet",
      clientId: "localhost-id",
      uxMode: "popup",
    },
    chainConfig: chainNamespace && chainId ? getChainConfig(chainNamespace, chainId) : null,
    loginSettings: {},
  };
};
