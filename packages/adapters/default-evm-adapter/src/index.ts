import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, IWeb3AuthCoreOptions } from "@web3auth/base";
import { createStore as createMipd } from "mipd";

import { InjectedEvmAdapter } from "./injectedAdapter";

export const getDefaultExternalAdapters = async (params: { options: IWeb3AuthCoreOptions }): Promise<IAdapter<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.id) as CustomChainConfig),
    ...(chainConfig || {}),
  };

  const [{ TorusWalletAdapter }, { MetamaskAdapter }, { WalletConnectV2Adapter }] = await Promise.all([
    import("@web3auth/torus-evm-adapter"),
    import("@web3auth/metamask-adapter"),
    import("@web3auth/wallet-connect-v2-adapter"),
  ]);
  const torusWalletAdapter = new TorusWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  const metamaskAdapter = new MetamaskAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

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

  // multiple injected provider discovery
  const mipd = createMipd();
  const injectedProviders = mipd.getProviders().map(
    (providerDetail) =>
      new InjectedEvmAdapter({
        chainConfig: finalChainConfig,
        clientId,
        sessionTime,
        web3AuthNetwork,
        useCoreKitKey,
        name: providerDetail.info.name,
        provider: providerDetail.provider,
      })
  );

  return [...injectedProviders, torusWalletAdapter, metamaskAdapter, wcv2Adapter];
};
