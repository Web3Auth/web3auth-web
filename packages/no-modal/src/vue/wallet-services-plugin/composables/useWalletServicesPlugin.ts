// eslint-disable-next-line import/no-extraneous-dependencies
import { inject } from "vue";

import { WalletServicesPluginError } from "@/core/base";

import { WalletServicesContextKey } from "../context";
import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = inject<IWalletServicesContext>(WalletServicesContextKey);
  if (!context) throw WalletServicesPluginError.fromCode(1000, "usage of `useWalletServicesPlugin` not wrapped in `WalletServicesProvider`.");
  return context;
};
