import { useContext } from "react";

import { Web3AuthInnerContext } from "../context/Web3AuthInnerContext";
import { IWeb3authInnerContext } from "../interfaces";

export const useWeb3Auth = (): IWeb3authInnerContext => {
  const context = useContext(Web3AuthInnerContext);
  if (context === undefined) {
    throw new Error("usage of useWeb3Auth not wrapped in `Web3AuthContextProvider`.");
  }
  return context;
};
