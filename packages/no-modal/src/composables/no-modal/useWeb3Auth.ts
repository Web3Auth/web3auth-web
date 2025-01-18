// eslint-disable-next-line import/no-extraneous-dependencies
import { inject } from "vue";

import { WalletInitializationError, Web3AuthContextKey } from "@/core/base";

import { IWeb3AuthContext } from "./interfaces";

export const useWeb3Auth = () => {
  const context = inject<IWeb3AuthContext>(Web3AuthContextKey);
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of `useWeb3Auth` not wrapped in `Web3AuthProvider`.");
  return context;
};
