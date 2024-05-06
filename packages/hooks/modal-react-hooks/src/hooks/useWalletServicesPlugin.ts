import { useContext } from "react";

import { WalletServicesContext } from "../context/WalletServicesContext";
import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = useContext(WalletServicesContext);
  if (context === undefined) {
    throw new Error("usage of useWalletServicesPlugin not wrapped in `WalletServicesContextProvider`.");
  }
  return context;
};
