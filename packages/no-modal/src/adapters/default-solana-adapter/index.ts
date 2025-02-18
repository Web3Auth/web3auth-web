import { AdapterFn, CHAIN_NAMESPACES, IWeb3AuthCoreOptions, WalletInitializationError } from "@/core/base";

import { walletConnectV2Adapter } from "../wallet-connect-v2-adapter";
import { getSolanaInjectedAdapters } from "./injectedAdapters";

export const getSolanaDefaultExternalAdapters = ({ options }: { options: IWeb3AuthCoreOptions }): AdapterFn[] => {
  const { chainConfig } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const injectedProviders = getSolanaInjectedAdapters({ options });
  return [...injectedProviders, walletConnectV2Adapter()];
};

export { getSolanaInjectedAdapters };
