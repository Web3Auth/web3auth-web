import { useContext } from "react";

import { IWeb3authContext } from "./interfaces";
import { Web3AuthContext } from "./Web3AuthProvider";

export const useWeb3Auth = (): IWeb3authContext => {
  const context = useContext(Web3AuthContext);
  return context.core;
};
