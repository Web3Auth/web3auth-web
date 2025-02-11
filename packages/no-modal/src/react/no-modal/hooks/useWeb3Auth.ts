import { useContext } from "react";

import { WalletInitializationError } from "@/core/base";

import { IWeb3AuthInnerContext } from "../interfaces";
import { Web3AuthInnerContext } from "../Web3AuthInnerContext";

export const useWeb3Auth = (): IWeb3AuthInnerContext => {
  const context = useContext(Web3AuthInnerContext);
  if (!context) {
    throw WalletInitializationError.fromCode(1000, "usage of useWeb3Auth not wrapped in `Web3AuthContextProvider`.");
  }
  return context;
};
