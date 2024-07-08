import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IConnector, IWeb3AuthCoreOptions } from "@web3auth/base";

export const getDefaultExternalConnectors = async (params: { options: IWeb3AuthCoreOptions }): Promise<IConnector<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.id) as CustomChainConfig),
    ...(chainConfig || {}),
  };

  const [{ TorusWalletConnector }, { MetamaskConnector }, { WalletConnectConnector }] = await Promise.all([
    import("@web3auth/torus-evm-connector"),
    import("@web3auth/metamask-connector"),
    import("@web3auth/wallet-connect-connector"),
  ]);
  const torusWalletConnector = new TorusWalletConnector({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  const metamaskConnector = new MetamaskConnector({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  const wcConnector = new WalletConnectConnector({
    chainConfig: finalChainConfig,
    clientId,
    sessionTime,
    web3AuthNetwork,
    useCoreKitKey,
    connectorSettings: {
      walletConnectInitOptions: {},
    },
  });

  return [torusWalletConnector, metamaskConnector, wcConnector];
};
