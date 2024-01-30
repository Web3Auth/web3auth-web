import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
  Web3AuthNoModalOptions,
} from "@web3auth/base";

export const getDefaultAdapters = async (params: { name: WALLET_ADAPTER_TYPE; options: Web3AuthNoModalOptions }): Promise<IAdapter<unknown>> => {
  const { name, options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, uiConfig, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId) as CustomChainConfig),
    ...(chainConfig || {}),
  };
  if (name === WALLET_ADAPTERS.TORUS_EVM) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
    const adapter = new TorusWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });
    return adapter;
  } else if (name === WALLET_ADAPTERS.METAMASK) {
    const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
    const adapter = new MetamaskAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });
    return adapter;
  } else if (name === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
    const { WalletConnectV2Adapter } = await import("@web3auth/wallet-connect-v2-adapter");
    const adapter = new WalletConnectV2Adapter({
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
    return adapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
    const { OpenloginAdapter, getOpenloginDefaultOptions } = await import("@web3auth/openlogin-adapter");

    const defaultOptions = getOpenloginDefaultOptions();
    const adapter = new OpenloginAdapter({
      ...defaultOptions,
      clientId,
      useCoreKitKey,
      chainConfig: { ...finalChainConfig },
      adapterSettings: { ...defaultOptions.adapterSettings, clientId, network: web3AuthNetwork, whiteLabel: uiConfig },
      sessionTime,
      web3AuthNetwork,
    });
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
