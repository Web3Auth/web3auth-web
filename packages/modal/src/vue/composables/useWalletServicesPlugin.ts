import { WalletInitializationError } from "@web3auth/no-modal";
import { inject } from "vue";

import { WalletServicesContextKey } from "../context/WalletServicesContext";
import { IWalletServicesInnerContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesInnerContext => {
  const context = inject<IWalletServicesInnerContext>(WalletServicesContextKey);
  if (!context) throw WalletInitializationError.fromCode(1000, "usage of useWalletServicesPlugin not wrapped in `WalletServicesContextProvider`.");
  return context;
};
