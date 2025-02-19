import { UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/auth";

import { AuthConnectorOptions } from "./interface";

export const getAuthDefaultOptions = (): AuthConnectorOptions => {
  return {
    connectorSettings: {
      network: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
      clientId: "",
      uxMode: UX_MODE.POPUP,
    },
    loginSettings: {},
    coreOptions: {
      chains: [],
      clientId: "",
    },
  };
};
