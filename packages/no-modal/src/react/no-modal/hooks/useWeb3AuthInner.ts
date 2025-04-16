import { useContext } from "react";

import { WalletInitializationError } from "@/core/base";

import { Web3AuthInnerContext } from "../context/Web3AuthInnerContext";
import { IWeb3AuthInnerContext } from "../interfaces";

export const useWeb3AuthInner = (): IWeb3AuthInnerContext => {
  const context = useContext(Web3AuthInnerContext);
  if (!context) {
    throw WalletInitializationError.fromCode(1000, "usage of useWeb3Auth not wrapped in `Web3AuthContextProvider`.");
  }
  return context;
};
