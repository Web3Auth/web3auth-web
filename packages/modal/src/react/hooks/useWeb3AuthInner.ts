import { WalletInitializationError } from "@web3auth/no-modal";
import { useContext } from "react";

import { Web3Auth } from "../../modalManager";
import { Web3AuthInnerContext } from "../context/Web3AuthInnerContext";
import { IWeb3AuthInnerContext } from "../interfaces";

function isModalWeb3AuthInnerContext(context: React.ContextType<typeof Web3AuthInnerContext>): context is IWeb3AuthInnerContext {
  return !!context && context.web3Auth instanceof Web3Auth;
}

export const useWeb3AuthInner = (): IWeb3AuthInnerContext => {
  const context = useContext(Web3AuthInnerContext);
  if (!isModalWeb3AuthInnerContext(context)) {
    throw WalletInitializationError.fromCode(1000, "usage of useWeb3Auth not wrapped in modal `Web3AuthProvider`.");
  }

  return context;
};
