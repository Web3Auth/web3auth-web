import { IdentifierString } from "@wallet-standard/base";
import { CustomChainConfig } from "@web3auth/base";

export const getSolanaChainByChainConfig = (chainConfig: CustomChainConfig): IdentifierString => {
  switch (chainConfig.chainId) {
    case "0x1":
      return "solana:mainnet";
    case "0x2":
      return "solana:testnet";
    case "0x3":
      return "solana:devnet";
    default:
      return null;
  }
};

export const getWalletKey = (name: string) => {
  let walletKey = name.toLowerCase();
  // remove decriptive part after | e.g. "Crypto.com | Defi Wallet" => "Crypto.com"
  walletKey = walletKey.split("|")[0];

  // replace -  with space e.g. "Trust - Wallet" => "Trust Wallet"
  walletKey = walletKey.replace(/-/g, " ");

  // replace multiple spaces with single space
  walletKey = walletKey.replace(/\s+/g, " ");

  // remove trailing "wallet"
  walletKey = walletKey.replace(/wallet$/i, "").trim();

  // replace space with -
  walletKey = walletKey.replace(/\s/g, "-");

  return walletKey;
};
