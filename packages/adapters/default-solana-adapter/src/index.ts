import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, IWeb3AuthCoreOptions, WalletInitializationError } from "@web3auth/base";
import { WalletConnectV2Adapter } from "@web3auth/wallet-connect-v2-adapter";

import { getInjectedAdapters } from "./injectedAdapters";

export const getDefaultExternalAdapters = (params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId, clientId) as CustomChainConfig),
    ...(chainConfig || {}),
  };

  const wcv2Adapter = new WalletConnectV2Adapter({
    chainConfig: finalChainConfig,
    clientId,
    sessionTime,
    web3AuthNetwork,
    useCoreKitKey,
    adapterSettings: {
      walletConnectInitOptions: {},
    },
  });
  const injectedProviders = getInjectedAdapters({ options });

  return [...injectedProviders, wcv2Adapter];
};

export { getInjectedAdapters };
