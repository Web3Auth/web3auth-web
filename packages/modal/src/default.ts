import type { OPENLOGIN_NETWORK_TYPE, OpenLoginOptions } from "@toruslabs/openlogin-utils";
import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth/base-provider";

export async function getPrivateKeyProvider(chainConfig: CustomChainConfig): Promise<IBaseProvider<string>> {
  if (chainConfig.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    const { SolanaPrivateKeyProvider } = await import("@web3auth/solana-provider");
    return new SolanaPrivateKeyProvider({ config: { chainConfig } });
  } else if (chainConfig.chainNamespace === CHAIN_NAMESPACES.EIP155) {
    const { EthereumPrivateKeyProvider } = await import("@web3auth/ethereum-provider");
    return new EthereumPrivateKeyProvider({ config: { chainConfig } });
  } else if (chainConfig.chainNamespace === CHAIN_NAMESPACES.OTHER) {
    // Modal doesn't support ripple provider
    // Can always override this with a custom provider
    return new CommonPrivateKeyProvider({ config: { chainConfig } });
  }
  throw new Error(`Invalid chainNamespace: ${chainConfig.chainNamespace} found while connecting to wallet`);
}

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
  } else if (name === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
    const { WalletConnectV2Adapter } = await import("@web3auth/wallet-connect-v2-adapter");
    const adapter = new WalletConnectV2Adapter({
      chainConfig: finalChainConfig,
      clientId,
      sessionTime,
      web3AuthNetwork,
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

    const privateKeyProvider: IBaseProvider<string> = await getPrivateKeyProvider(finalChainConfig);

    const defaultOptions = getOpenloginDefaultOptions();
    const adapter = new OpenloginAdapter({
      ...defaultOptions,
      clientId,
      chainConfig: { ...finalChainConfig },
      adapterSettings: { ...(defaultOptions.adapterSettings as OpenLoginOptions), clientId, network: web3AuthNetwork },
      sessionTime,
      web3AuthNetwork,
      privateKeyProvider,
    });
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
