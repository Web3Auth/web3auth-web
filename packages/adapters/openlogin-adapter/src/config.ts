import { OPENLOGIN_NETWORK, UX_MODE } from "@toruslabs/openlogin-mpc";
import { ChainNamespaceType, getChainConfig } from "@web3auth-mpc/base";

import { OpenloginAdapterOptions } from "./interface";

export const getOpenloginDefaultOptions = (chainNamespace?: ChainNamespaceType, chainId?: number | string): OpenloginAdapterOptions => {
  return {
    adapterSettings: {
      network: OPENLOGIN_NETWORK.MAINNET,
      clientId: "",
      uxMode: UX_MODE.POPUP,
    },
    chainConfig: chainNamespace ? getChainConfig(chainNamespace, chainId) : null,
    loginSettings: {},
  };
};
