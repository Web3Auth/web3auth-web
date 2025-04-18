import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import { getWallets, type WalletsEventNames } from "@wallet-standard/app";
import { type Wallet } from "@wallet-standard/base";
import { StandardConnect } from "@wallet-standard/features";

import { walletStandardConnector } from "./walletStandardConnector";

const hasSolanaWalletStandardFeatures = (wallet: Wallet): boolean => {
  const { chains, features } = wallet;
  const isSolana = chains.some((chain) => chain.startsWith("solana"));
  if (!isSolana) return;
  const hasRequiredFeatures = [StandardConnect, SolanaSignMessage, SolanaSignTransaction, SolanaSignAndSendTransaction].every((feature) =>
    Object.keys(features).includes(feature)
  );
  if (!hasRequiredFeatures) return false;

  return true;
};

export { getWallets as createSolanaMipd, hasSolanaWalletStandardFeatures, type WalletsEventNames, walletStandardConnector };
