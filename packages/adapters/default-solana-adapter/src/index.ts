import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, Web3AuthNoModalOptions } from "@web3auth/base";

export const getDefaultAdapters = async (params: { options: Web3AuthNoModalOptions }): Promise<IAdapter<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, uiConfig, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId) as CustomChainConfig),
    ...(chainConfig || {}),
  };
  const [{ SolanaWalletAdapter }, { PhantomAdapter }, { OpenloginAdapter, getOpenloginDefaultOptions }] = await Promise.all([
    import("@web3auth/torus-solana-adapter"),
    import("@web3auth/phantom-adapter"),
    import("@web3auth/openlogin-adapter"),
  ]);
  const solanaWalletAdapter = new SolanaWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  const phantomAdapter = new PhantomAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

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
  return [solanaWalletAdapter, phantomAdapter, openloginAdapter];
};
