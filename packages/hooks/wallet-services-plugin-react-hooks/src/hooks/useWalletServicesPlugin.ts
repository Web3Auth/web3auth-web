import { WalletInitializationError } from "@web3auth/base";
import { useContext } from "react";

import { WalletServicesContext } from "../context/WalletServicesContext";
import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = useContext(WalletServicesContext);
  if (!context) {
    throw WalletInitializationError.fromCode(1000, "usage of useWalletServicesPlugin not wrapped in `WalletServicesContextProvider`.");
  }
  return context;
};
