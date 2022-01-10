import type { OpenLoginOptions } from "@toruslabs/openlogin";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";

export const getDefaultAdapterModule = async (params: {
  name: WALLET_ADAPTER_TYPE;
  chainNamespace: ChainNamespaceType;
  clientId: string;
  customChainConfig?: Partial<Omit<CustomChainConfig, "chainNamespace">>;
}): Promise<IAdapter<unknown>> => {
  const { name, chainNamespace, customChainConfig, clientId } = params;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainNamespace)) throw new Error(`Invalid chainNamespace: ${chainNamespace}`);
  const finalChainConfig = { ...(getChainConfig(chainNamespace, customChainConfig?.chainId) as CustomChainConfig), ...(customChainConfig || {}) };
  if (name === WALLET_ADAPTERS.TORUS_EVM) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
    const adapter = new TorusWalletAdapter({ chainConfig: finalChainConfig });
    return adapter;
  } else if (name === WALLET_ADAPTERS.TORUS_SOLANA) {
    const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
    const adapter = new SolanaWalletAdapter({ chainConfig: finalChainConfig });
    return adapter;
  } else if (name === WALLET_ADAPTERS.METAMASK) {
    const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
    const adapter = new MetamaskAdapter({ chainConfig: finalChainConfig });
    return adapter;
  } else if (name === WALLET_ADAPTERS.PHANTOM) {
    const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
    const adapter = new PhantomAdapter({ chainConfig: finalChainConfig });
    return adapter;
  } else if (name === WALLET_ADAPTERS.WALLET_CONNECT_V1) {
    const { WalletConnectV1Adapter } = await import("@web3auth/wallet-connect-v1-adapter");
    const adapter = new WalletConnectV1Adapter({ chainConfig: finalChainConfig });
    return adapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
    const { OpenloginAdapter, getOpenloginDefaultOptions } = await import("@web3auth/openlogin-adapter");
    const defaultOptions = getOpenloginDefaultOptions(chainNamespace, customChainConfig?.chainId);
    const adapter = new OpenloginAdapter({
      ...defaultOptions,
      adapterSettings: { ...(defaultOptions.adapterSettings as OpenLoginOptions), clientId },
    });
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
