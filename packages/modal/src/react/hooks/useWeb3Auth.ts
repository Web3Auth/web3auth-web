import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IUseWeb3Auth = IWeb3AuthInnerContext;

export const useWeb3Auth = (): IUseWeb3Auth => {
  const context = useWeb3AuthInner();
  return context;
};
