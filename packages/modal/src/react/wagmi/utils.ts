import { cookieToInitialState } from "wagmi";

import { defaultWagmiConfig } from "./constants";

export const cookieToWagmiState = (cookie: string | null, wagmiStorageKeyPrefix?: string) => {
  if (!cookie) return undefined;
  if (wagmiStorageKeyPrefix) {
    defaultWagmiConfig.storage.key = wagmiStorageKeyPrefix;
  }
  return cookieToInitialState(defaultWagmiConfig, cookie);
};
