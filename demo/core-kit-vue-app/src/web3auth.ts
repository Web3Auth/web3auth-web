import { CHAIN_NAMESPACES } from "@web3auth/base";
import { UX_MODE, Web3Auth } from "@web3auth/core-kit";

const web3auth = new Web3Auth({
  clientId: "torus",
  chainConfig: {
    chainId: "0x1",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    rpcTarget: "https://rpc.ankr.com/eth",
  },
  web3AuthNetwork: "testnet",
  baseUrl: `${location.origin}/serviceworker`,
  uxMode: UX_MODE.POPUP,
  manualSync: true,
  enableLogging: true,
});

export default web3auth;
