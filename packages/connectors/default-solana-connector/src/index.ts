import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IConnector, IWeb3AuthCoreOptions } from "@web3auth/base";

export const getDefaultExternalConnectors = async (params: { options: IWeb3AuthCoreOptions }): Promise<IConnector<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.id) as CustomChainConfig),
    ...(chainConfig || {}),
  };
  const [{ SolanaWalletConnector }, { PhantomConnector }] = await Promise.all([
    import("@web3auth/torus-solana-connector"),
    import("@web3auth/phantom-connector"),
  ]);
  const solanaWalletConnector = new SolanaWalletConnector({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  const phantomConnector = new PhantomConnector({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  return [solanaWalletConnector, phantomConnector];
};
