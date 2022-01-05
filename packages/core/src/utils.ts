import { ChainNamespaceType, IAdapter, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import { OpenLoginOptions } from "@web3auth/openlogin-adapter";

export const getDefaultAdapterModule = async (params: {
  name: WALLET_ADAPTER_TYPE;
  chainNamespace: ChainNamespaceType;
  clientId: string;
  chainId?: number | string;
}): Promise<IAdapter<unknown>> => {
  const { name, chainNamespace, chainId, clientId } = params;
  if (name === WALLET_ADAPTERS.TORUS_EVM) {
    const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
    const adapter = new TorusWalletAdapter({});
    return adapter;
  } else if (name === WALLET_ADAPTERS.TORUS_SOLANA) {
    const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
    const adapter = new SolanaWalletAdapter({});
    return adapter;
  } else if (name === WALLET_ADAPTERS.METAMASK) {
    const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
    const adapter = new MetamaskAdapter({});
    return adapter;
  } else if (name === WALLET_ADAPTERS.PHANTOM) {
    const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
    const adapter = new PhantomAdapter({});
    return adapter;
  } else if (name === WALLET_ADAPTERS.WALLET_CONNECT_V1) {
    const { WalletConnectV1Adapter } = await import("@web3auth/wallet-connect-v1-adapter");
    const adapter = new WalletConnectV1Adapter({});
    return adapter;
  } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
    const { OpenloginAdapter, getOpenloginDefaultOptions } = await import("@web3auth/openlogin-adapter");
    const defaultOptions = getOpenloginDefaultOptions(chainNamespace, chainId);
    // eslint-disable-next-line no-console
    console.log("default options", defaultOptions);
    const adapter = new OpenloginAdapter({
      ...defaultOptions,
      adapterSettings: { ...(defaultOptions.adapterSettings as OpenLoginOptions), clientId },
    });
    return adapter;
  }
  throw new Error("Invalid wallet adapter name");
};
