import { WalletInitializationError } from "@web3auth/base";
import { inject } from "vue";

import { Web3AuthContextKey } from "../Web3AuthProvider";

export const useWeb3Auth = () => {
  const context = inject(Web3AuthContextKey);
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of `useWeb3Auth` not wrapped in `Web3AuthProvider`.");
  return context;
};
