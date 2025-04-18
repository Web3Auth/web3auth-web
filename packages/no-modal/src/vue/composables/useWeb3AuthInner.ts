import { inject } from "vue";

import { WalletInitializationError, Web3AuthContextKey } from "../../base";
import { IWeb3AuthInnerContext } from "../interfaces";

export const useWeb3AuthInner = (): IWeb3AuthInnerContext => {
  const context = inject<IWeb3AuthInnerContext>(Web3AuthContextKey);
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of `useWeb3Auth` not wrapped in `Web3AuthProvider`.");
  return context;
};
