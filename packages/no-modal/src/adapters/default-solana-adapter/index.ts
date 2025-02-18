import { AdapterFn } from "@/core/base";

import { walletConnectV2Adapter } from "../wallet-connect-v2-adapter";
import { getSolanaInjectedAdapters } from "./injectedAdapters";

export const getSolanaDefaultExternalAdapters = (): AdapterFn[] => {
  const injectedProviders = getSolanaInjectedAdapters();
  return [...injectedProviders, walletConnectV2Adapter()];
};

export { getSolanaInjectedAdapters };
