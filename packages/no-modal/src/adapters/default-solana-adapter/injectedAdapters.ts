import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import { getWallets } from "@wallet-standard/app";
import { StandardConnect } from "@wallet-standard/features";

import { BaseAdapter, IAdapter, IWeb3AuthCoreOptions, normalizeWalletName } from "@/core/base";

import { WalletStandardAdapter } from "./walletStandardAdapter";

export const getSolanaInjectedAdapters = (_params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
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

    standardWalletAdapters.push(new WalletStandardAdapter({ name: normalizeWalletName(name), wallet }));
  });
  return standardWalletAdapters;
};
