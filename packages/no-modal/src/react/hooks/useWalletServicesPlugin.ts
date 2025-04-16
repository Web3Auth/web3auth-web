import { useContext } from "react";

import { WalletServicesContext } from "../context/WalletServicesInnerContext";
import { IWalletServicesContext } from "../interfaces";

export const useWalletServicesPlugin = (): IWalletServicesContext => {
  const { ready, plugin, connecting } = useContext(WalletServicesContext);
  return { ready, plugin, connecting };
};
