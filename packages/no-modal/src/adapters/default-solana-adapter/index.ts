import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import { getWallets } from "@wallet-standard/app";
import { StandardConnect } from "@wallet-standard/features";

import { AdapterFn, normalizeWalletName } from "@/core/base";

import { walletStandardAdapter } from "./walletStandardAdapter";

export const getSolanaInjectedAdapters = (): AdapterFn[] => {
  // get installed wallets that support standard wallet
  const standardWalletAdapters = [] as AdapterFn[];
  const wallets = getWallets().get();
  wallets.forEach((wallet) => {
    const { name, chains, features } = wallet;
    const isSolana = chains.some((chain) => chain.startsWith("solana"));
    if (!isSolana) return;
    const hasRequiredFeatures = [StandardConnect, SolanaSignMessage, SolanaSignTransaction, SolanaSignAndSendTransaction].every((feature) =>
      Object.keys(features).includes(feature)
    );
    if (!hasRequiredFeatures) return;

    standardWalletAdapters.push(walletStandardAdapter({ name: normalizeWalletName(name), wallet }));
  });
  return standardWalletAdapters;
};

export { walletStandardAdapter };
