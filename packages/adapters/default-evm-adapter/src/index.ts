import { CHAIN_NAMESPACES, CustomChainConfig, getChainConfig, IAdapter, IWeb3AuthCoreOptions, WalletInitializationError } from "@web3auth/base";
import { createStore as createMipd } from "mipd";

import { InjectedEvmAdapter } from "./injectedEvmAdapter";

export const getDefaultExternalAdapters = async (params: { options: IWeb3AuthCoreOptions }): Promise<IAdapter<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId) as CustomChainConfig),
    ...(chainConfig || {}),
  };

  const [{ TorusWalletAdapter }, { WalletConnectV2Adapter }] = await Promise.all([
    import("@web3auth/torus-evm-adapter"),
    import("@web3auth/wallet-connect-v2-adapter"),
  ]);
  const torusWalletAdapter = new TorusWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  const wcv2Adapter = new WalletConnectV2Adapter({
    chainConfig: finalChainConfig,
    clientId,
    sessionTime,
    web3AuthNetwork,
    useCoreKitKey,
    adapterSettings: {
      walletConnectInitOptions: {},
    },
  });

  // EIP-6963: multiple injected provider discovery
  const mipd = createMipd();
  const injectedProviders = mipd.getProviders().map((providerDetail) => {
    // remove "wallet" from the wallet name e.g. Coinbase Wallet => coinbase
    let walletName = providerDetail.info.name.toLowerCase();
    if (walletName.toLowerCase().endsWith("wallet")) {
      walletName = walletName.slice(0, -6).trim();
    }
    walletName = walletName.replace(/\s/g, "-");

    return new InjectedEvmAdapter({
      name: walletName,
      provider: providerDetail.provider,
      chainConfig: finalChainConfig,
      clientId,
      sessionTime,
      web3AuthNetwork,
      useCoreKitKey,
    });
  });

  return [...injectedProviders, torusWalletAdapter, wcv2Adapter];
};
