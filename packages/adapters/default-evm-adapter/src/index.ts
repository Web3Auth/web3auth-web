import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, Web3AuthNoModalOptions } from "@web3auth/base";

export const getDefaultAdapters = async (params: { options: Web3AuthNoModalOptions }): Promise<IAdapter<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, uiConfig, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId) as CustomChainConfig),
    ...(chainConfig || {}),
  };

  const [{ TorusWalletAdapter }, { MetamaskAdapter }, { WalletConnectV2Adapter }, { OpenloginAdapter, getOpenloginDefaultOptions }] =
    await Promise.all([
      import("@web3auth/torus-evm-adapter"),
      import("@web3auth/metamask-adapter"),
      import("@web3auth/wallet-connect-v2-adapter"),
      import("@web3auth/openlogin-adapter"),
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
      walletConnectInitOptions: {
        // Using a default wallet connect project id for web3auth modal integration
        projectId: "d3c63f19f9582f8ba48e982057eb096b",
      },
    },
  });

  const defaultOptions = getOpenloginDefaultOptions();
  const openloginAdapter = new OpenloginAdapter({
    ...defaultOptions,
    clientId,
    useCoreKitKey,
    chainConfig: { ...finalChainConfig },
    adapterSettings: { ...defaultOptions.adapterSettings, clientId, network: web3AuthNetwork, whiteLabel: uiConfig },
    sessionTime,
    web3AuthNetwork,
  });

  return [torusWalletAdapter, metamaskAdapter, wcv2Adapter, openloginAdapter];
};
