import { UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/auth";

import { IWeb3Auth } from "@/core/base";

import { AuthConnectorOptions } from "./interface";

export const getAuthDefaultOptions = ({
  getCurrentChain,
  getChain,
}: {
  getCurrentChain: IWeb3Auth["getCurrentChain"];
  getChain: IWeb3Auth["getChain"];
}): AuthConnectorOptions => {
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
    getCurrentChain,
    getChain,
  };
};
