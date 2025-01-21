// eslint-disable-next-line import/no-extraneous-dependencies
import { useContext } from "react";

import { WalletInitializationError } from "@/core/base";

import { IWalletServicesContext } from "../interfaces";
import { WalletServicesContext } from "../WalletServicesContext";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = useContext(WalletServicesContext);
  if (!context) {
    throw WalletInitializationError.fromCode(1000, "usage of useWalletServicesPlugin not wrapped in `WalletServicesContextProvider`.");
  }
  return context;
};
