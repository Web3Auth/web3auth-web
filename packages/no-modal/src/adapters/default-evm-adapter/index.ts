import { IAdapter, IWeb3AuthCoreOptions } from "@/core/base";
import { WalletConnectV2Adapter } from "@/core/wallet-connect-v2-adapter";

import { getEvmInjectedAdapters } from "./injectedAdapters";

export const getEvmDefaultExternalAdapters = (params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
  const { options } = params;

  const wcv2Adapter = new WalletConnectV2Adapter({ adapterSettings: { walletConnectInitOptions: {} } });
  const injectedProviders = getEvmInjectedAdapters({ options });

  return [...injectedProviders, wcv2Adapter];
};

export { getEvmInjectedAdapters };
