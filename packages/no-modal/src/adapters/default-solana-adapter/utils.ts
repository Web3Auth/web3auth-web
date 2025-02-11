import { IdentifierString } from "@wallet-standard/base";

import { CustomChainConfig } from "@/core/base";

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
