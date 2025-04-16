import { useContext } from "react";

import { WalletServicesContext } from "../context/WalletServicesInnerContext";
import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = useContext(WalletServicesContext);
  if (!context) throw new Error("WalletServicesContext not found");
  return context;
};
