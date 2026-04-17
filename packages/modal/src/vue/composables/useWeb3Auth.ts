import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export const useWeb3Auth = (): IWeb3AuthInnerContext => {
  const context = useWeb3AuthInner();

  return context;
};
