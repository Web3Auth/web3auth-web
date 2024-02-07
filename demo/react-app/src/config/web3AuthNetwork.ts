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
} as const;

export type WEB3AUTH_NETWORK_TYPE = keyof typeof WEB3AUTH_NETWORK;
