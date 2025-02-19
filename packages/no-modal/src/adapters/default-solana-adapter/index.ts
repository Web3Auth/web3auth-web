import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import { getWallets } from "@wallet-standard/app";
import { StandardConnect } from "@wallet-standard/features";

import { ConnectorFn, normalizeWalletName } from "@/core/base";

import { walletStandardConnector } from "./walletStandardAdapter";

export const getSolanaInjectedConnectors = (): ConnectorFn[] => {
  // get installed wallets that support standard wallet
  const standardWalletConnectors = [] as ConnectorFn[];
  const wallets = getWallets().get();
  wallets.forEach((wallet) => {
    const { name, chains, features } = wallet;
    const isSolana = chains.some((chain) => chain.startsWith("solana"));
    if (!isSolana) return;
    const hasRequiredFeatures = [StandardConnect, SolanaSignMessage, SolanaSignTransaction, SolanaSignAndSendTransaction].every((feature) =>
      Object.keys(features).includes(feature)
    );
    if (!hasRequiredFeatures) return;

    standardWalletConnectors.push(walletStandardConnector({ name: normalizeWalletName(name), wallet }));
  });
  return standardWalletConnectors;
};

export { walletStandardConnector };
