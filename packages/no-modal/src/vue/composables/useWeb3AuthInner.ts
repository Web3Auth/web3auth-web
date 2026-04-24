import { IWeb3AuthInnerContext } from "../interfaces";
import { useInjectedWeb3AuthInnerContext } from "./useInjectedWeb3AuthInnerContext";

export const useWeb3AuthInner = (): IWeb3AuthInnerContext => {
  return useInjectedWeb3AuthInnerContext<IWeb3AuthInnerContext>();
};
