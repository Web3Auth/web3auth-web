import { OPENLOGIN_NETWORK, UX_MODE } from "@toruslabs/openlogin-utils";

import { OpenloginAdapterOptions } from "./interface";

export const getOpenloginDefaultOptions = (): OpenloginAdapterOptions => {
  return {
    adapterSettings: {
      network: OPENLOGIN_NETWORK.MAINNET,
      clientId: "",
      uxMode: UX_MODE.POPUP,
    },
    loginSettings: {},
    privateKeyProvider: undefined,
  };
};
