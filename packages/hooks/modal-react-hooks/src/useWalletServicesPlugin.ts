import { useContext } from "react";

import { IWalletServicesContext } from "./interfaces";
import { Web3AuthContext } from "./Web3AuthProvider";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const context = useContext(Web3AuthContext);
  return context.walletServices;
};
