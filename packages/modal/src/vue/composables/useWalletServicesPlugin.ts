import { WalletServicesContextKey } from "@web3auth/no-modal/vue";
import { inject } from "vue";

import { IWalletServicesInnerContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesInnerContext => {
  const context = inject<IWalletServicesInnerContext>(WalletServicesContextKey);
  if (!context) throw new Error("WalletServicesContext not found");
  return context;
};
