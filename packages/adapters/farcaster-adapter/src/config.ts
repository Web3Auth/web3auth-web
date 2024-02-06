import { OPENLOGIN_NETWORK, UX_MODE } from "@toruslabs/openlogin-utils";

import { FarcasterAdapterOptions } from "./interface";

export const getOpenloginDefaultOptions = (): FarcasterAdapterOptions => {
  return {
    adapterSettings: {
      network: OPENLOGIN_NETWORK.SAPPHIRE_MAINNET,
      clientId: "",
      uxMode: UX_MODE.POPUP,
    },
    loginSettings: {},
    privateKeyProvider: undefined,
  };
};
