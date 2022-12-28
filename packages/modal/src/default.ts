import type { OPENLOGIN_NETWORK_TYPE, OpenLoginOptions } from "@toruslabs/openlogin";
import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";

// warning: this function is not compatible with "OTHER" chain namespace.
export const getDefaultAdapterModule = async (params: {
  name: WALLET_ADAPTER_TYPE;
  clientId: string;
  customChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;
  sessionTime?: number;
  web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE;
}): Promise<IAdapter<unknown>> => {
  const { name, customChainConfig, clientId, sessionTime, web3AuthNetwork } = params;
  if (!Object.values(CHAIN_NAMESPACES).includes(customChainConfig.chainNamespace))
    throw new Error(`Invalid chainNamespace: ${customChainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(customChainConfig.chainNamespace, customChainConfig?.chainId) as CustomChainConfig),
    ...(customChainConfig || {}),
  };
  if (name === WALLET_ADAPTERS.TORUS_EVM) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
    const adapter = new TorusWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork });
    return adapter;
  } else if (name === WALLET_ADAPTERS.TORUS_SOLANA) {
    const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
    const adapter = new SolanaWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork });
    return adapter;
  } else if (name === WALLET_ADAPTERS.METAMASK) {
    const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
    const adapter = new MetamaskAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork });
    return adapter;
  } else if (name === WALLET_ADAPTERS.PHANTOM) {
    const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
    const adapter = new PhantomAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork });
    return adapter;
  } else if (name === WALLET_ADAPTERS.WALLET_CONNECT_V1) {
    const { WalletConnectV1Adapter } = await import("@web3auth/wallet-connect-v1-adapter");
    const adapter = new WalletConnectV1Adapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork });
    return adapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
    const { OpenloginAdapter, getOpenloginDefaultOptions } = await import("@web3auth/openlogin-adapter");
    const defaultOptions = getOpenloginDefaultOptions();
    const adapter = new OpenloginAdapter({
      ...defaultOptions,
      clientId,
      chainConfig: { ...finalChainConfig },
      adapterSettings: { ...(defaultOptions.adapterSettings as OpenLoginOptions), clientId, network: web3AuthNetwork },
      sessionTime,
      web3AuthNetwork,
    });
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
