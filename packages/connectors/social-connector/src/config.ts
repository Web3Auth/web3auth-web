import { OPENLOGIN_NETWORK, UX_MODE } from "@toruslabs/openlogin-utils";

import { SocialConnectorOptions } from "./interface";

export const getSocialConnectorDefaultOptions = (): SocialConnectorOptions => {
  return {
    connectorSettings: {
      network: OPENLOGIN_NETWORK.SAPPHIRE_MAINNET,
      clientId: "",
      uxMode: UX_MODE.POPUP,
    },
    loginSettings: {},
    privateKeyProvider: undefined,
  };
};
