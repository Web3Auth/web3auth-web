import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import { getWallets } from "@wallet-standard/app";
import { StandardConnect } from "@wallet-standard/features";
import {
  BaseAdapter,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  IWeb3AuthCoreOptions,
  normalizeWalletName,
  WalletInitializationError,
} from "@web3auth/base";

import { WalletStandardAdapter } from "./walletStandardAdapter";

export const getDefaultExternalAdapters = async (params: { options: IWeb3AuthCoreOptions }): Promise<IAdapter<unknown>[]> => {
  const { options } = params;
  const { clientId, chainConfig, sessionTime, web3AuthNetwork, useCoreKitKey } = options;
  if (!Object.values(CHAIN_NAMESPACES).includes(chainConfig.chainNamespace))
    throw WalletInitializationError.invalidParams(`Invalid chainNamespace: ${chainConfig.chainNamespace}`);
  const finalChainConfig = {
    ...(getChainConfig(chainConfig.chainNamespace, chainConfig?.chainId) as CustomChainConfig),
    ...(chainConfig || {}),
  };
  const [{ SolanaWalletAdapter }] = await Promise.all([import("@web3auth/torus-solana-adapter")]);
  const solanaWalletAdapter = new SolanaWalletAdapter({ chainConfig: finalChainConfig, clientId, sessionTime, web3AuthNetwork, useCoreKitKey });

  // get installed wallets that support standard wallet
  const standardWalletAdapters = [] as BaseAdapter<void>[];
  const wallets = getWallets().get();
  wallets.forEach((wallet) => {
    const { name, chains, features } = wallet;
    const isSolana = chains.some((chain) => chain.startsWith("solana"));
    if (!isSolana) return;
    const hasRequiredFeatures = [StandardConnect, SolanaSignMessage, SolanaSignTransaction, SolanaSignAndSendTransaction].every((feature) =>
      Object.keys(features).includes(feature)
    );
    if (!hasRequiredFeatures) return;

    standardWalletAdapters.push(
      new WalletStandardAdapter({
        name: normalizeWalletName(name),
        wallet,
        chainConfig: finalChainConfig,
        clientId,
        sessionTime,
        web3AuthNetwork,
        useCoreKitKey,
      })
    );
  });
  return [solanaWalletAdapter, ...standardWalletAdapters];
};
