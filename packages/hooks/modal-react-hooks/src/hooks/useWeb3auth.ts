import { WalletInitializationError } from "@web3auth/base";
import { useContext } from "react";

import { Web3AuthInnerContext } from "../context/Web3AuthInnerContext";
import { IWeb3authInnerContext } from "../interfaces";

export const useWeb3Auth = (): IWeb3authInnerContext => {
  const context = useContext(Web3AuthInnerContext);
  if (!context) {
    throw WalletInitializationError.fromCode(1000, "usage of useWeb3Auth not wrapped in `Web3AuthContextProvider`.");
  }
  return context;
};
