import { inject } from "vue";

import { WalletInitializationError, Web3AuthContextKey } from "../../base";

export function useInjectedWeb3AuthInnerContext<TContext>(): TContext {
  const context = inject<TContext>(Web3AuthContextKey);
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of `useWeb3Auth` not wrapped in `Web3AuthProvider`.");
  return context;
}
