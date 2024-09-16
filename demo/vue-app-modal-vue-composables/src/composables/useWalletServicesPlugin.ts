import { WalletServicesPluginError } from "@web3auth/base";
import { inject } from "vue";

import { WalletServicesContextKey } from "../components/WalletServicesProvider.vue";
import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = inject<IWalletServicesContext>(WalletServicesContextKey);
  if (!context) throw WalletServicesPluginError.fromCode(1000, "usage of `useWalletServicesPlugin` not wrapped in `WalletServicesProvider`.");
  return context;
};
