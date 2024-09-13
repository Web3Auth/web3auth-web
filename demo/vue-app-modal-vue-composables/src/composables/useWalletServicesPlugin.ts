import { WalletServicesPluginError } from "@web3auth/base";
import { inject } from "vue";

import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = inject<IWalletServicesContext>("wallet_services");
  if (!context) throw WalletServicesPluginError.fromCode(1000, "usage of `useWalletServicesPlugin` not wrapped in `WalletServicesProvider`.");
  return context;
};
