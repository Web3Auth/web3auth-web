import { IAdapter, IWeb3AuthCoreOptions } from "@/core/base";

import { WalletConnectV2Adapter } from "../wallet-connect-v2-adapter";
import { getSolanaInjectedAdapters } from "./injectedAdapters";

export const getSolanaDefaultExternalAdapters = (params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
  const { options } = params;

  const wcv2Adapter = new WalletConnectV2Adapter({ adapterSettings: { walletConnectInitOptions: {} } });
  const injectedProviders = getSolanaInjectedAdapters({ options });

  return [...injectedProviders, wcv2Adapter];
};

export { getSolanaInjectedAdapters };
