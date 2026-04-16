import { inject } from "vue";

import { WalletServicesContextKey } from "../context/WalletServicesContext";
import { IWalletServicesInnerContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesInnerContext => {
  const context = inject<IWalletServicesInnerContext>(WalletServicesContextKey);
  if (!context) throw new Error("WalletServicesContext not found");
  return context;
};
