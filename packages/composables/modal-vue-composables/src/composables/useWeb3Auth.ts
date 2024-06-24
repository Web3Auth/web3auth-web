import { WalletInitializationError } from "@web3auth/base";
import { inject } from "vue";

import { IWeb3AuthContext } from "../interfaces";

export const useWeb3Auth = (): IWeb3AuthContext => {
  const context = inject<IWeb3AuthContext>("web3AuthContext");
  if (!context)
    throw WalletInitializationError.fromCode(
      1000,
      // TODO: or is it web3auth context provider
      "usage of useWeb3Auth not wrapped in `Web3AuthProvider`."
    );
  return context;
};
