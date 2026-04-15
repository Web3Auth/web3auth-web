import { type IUseWeb3AuthValue, pickWeb3AuthContextValue } from "@web3auth/no-modal/react";

import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IUseWeb3Auth = IUseWeb3AuthValue<IWeb3AuthInnerContext>;

export const useWeb3Auth = (): IUseWeb3Auth => {
  return pickWeb3AuthContextValue(useWeb3AuthInner());
};
