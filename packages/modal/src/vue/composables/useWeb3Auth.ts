import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IWeb3AuthModalContext = IWeb3AuthInnerContext;

export const useWeb3Auth = (): IWeb3AuthModalContext => {
  const context = useWeb3AuthInner();
  return context;
};
