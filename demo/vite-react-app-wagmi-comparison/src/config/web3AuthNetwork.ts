export const WEB3AUTH_NETWORK = {
  sapphire_mainnet: {
    displayName: "Sapphire Mainnet",
  },
  sapphire_devnet: {
    displayName: "Sapphire Devnet",
  },
  mainnet: {
    displayName: "Mainnet",
  },
  testnet: {
    displayName: "Testnet",
  },
  cyan: {
    displayName: "Cyan",
  },
  aqua: {
    displayName: "Aqua",
  },
  celeste: {
    displayName: "Celeste",
  },
} as const;

export type WEB3AUTH_NETWORK_TYPE = keyof typeof WEB3AUTH_NETWORK;
