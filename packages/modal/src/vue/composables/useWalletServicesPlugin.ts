import { WalletInitializationError } from "@web3auth/no-modal";
import { WalletServicesContextKey } from "@web3auth/no-modal/vue";
import { inject } from "vue";

import { IWalletServicesInnerContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesInnerContext => {
  const context = inject<IWalletServicesInnerContext>(WalletServicesContextKey);
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of useWalletServicesPlugin not wrapped in `WalletServicesContextProvider`.");
  return context;
};
