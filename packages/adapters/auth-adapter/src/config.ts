import { UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/auth";

import { AuthAdapterOptions } from "./interface";

export const getAuthDefaultOptions = (): AuthAdapterOptions => {
  return {
    adapterSettings: {
      network: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
      clientId: "",
      uxMode: UX_MODE.POPUP,
    },
    loginSettings: {},
    privateKeyProvider: undefined,
  };
};
