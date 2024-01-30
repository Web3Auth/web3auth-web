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
  if (name === WALLET_ADAPTERS.TORUS_SOLANA) {
    const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
    const adapter = new SolanaWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });
    return adapter;
  } else if (name === WALLET_ADAPTERS.PHANTOM) {
    const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
    const adapter = new PhantomAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });
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
