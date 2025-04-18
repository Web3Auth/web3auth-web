import { IdentifierString } from "@wallet-standard/base";

import { CustomChainConfig } from "../../base";

export const getSolanaChainByChainConfig = (chainConfig: CustomChainConfig): IdentifierString => {
  switch (chainConfig.chainId) {
    case "0x65":
      return "solana:mainnet";
    case "0x66":
      return "solana:testnet";
    case "0x67":
      return "solana:devnet";
    default:
      return null;
  }
};
