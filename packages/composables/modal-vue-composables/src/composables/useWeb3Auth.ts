import { WalletInitializationError } from "@web3auth/base";
import { inject } from "vue";

import { IWeb3AuthContext } from "../interfaces";

export const useWeb3Auth = () => {
  const context = inject<IWeb3AuthContext>("web3auth_context");
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of `useWeb3Auth` not wrapped in `Web3AuthProvider`.");
  return context;
};
