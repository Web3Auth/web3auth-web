import { useWeb3Auth as useSharedWeb3Auth } from "@web3auth/no-modal/react";
import { useContext } from "react";

import { Web3AuthInnerContext } from "../context/Web3AuthInnerContext";
import { IWeb3AuthInnerContext } from "../interfaces";

export const useWeb3AuthInner = (): IWeb3AuthInnerContext => {
  const context = useContext(Web3AuthInnerContext);
  // Reuse the shared missing-provider validation while keeping modal's full inner-context type local.
  useSharedWeb3Auth();
  return context as IWeb3AuthInnerContext;
};
