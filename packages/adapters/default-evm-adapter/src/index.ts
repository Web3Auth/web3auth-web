import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  IWeb3AuthCoreOptions,
  normalizeWalletName,
  WalletInitializationError,
} from "@web3auth/base";
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

  const [{ WalletConnectV2Adapter }] = await Promise.all([import("@web3auth/wallet-connect-v2-adapter")]);

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
  // We assume that all extensions have emitted by here.
  // TODO: Ideally, we must use reactive listening. We will do that with v9
  const injectedProviders = mipd.getProviders().map((providerDetail) => {
    return new InjectedEvmAdapter({
      name: normalizeWalletName(providerDetail.info.name),
      provider: providerDetail.provider,
      chainConfig: finalChainConfig,
      clientId,
      sessionTime,
      web3AuthNetwork,
      useCoreKitKey,
    });
  });

  return [...injectedProviders, wcv2Adapter];
};
