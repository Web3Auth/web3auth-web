import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IWeb3AuthNoModalContext = Omit<IWeb3AuthInnerContext, "isMFAEnabled" | "setIsMFAEnabled">;

export const useWeb3Auth = (): IWeb3AuthNoModalContext => {
  const { initError, isConnected, isInitialized, isInitializing, provider, status, web3Auth, getPlugin } = useWeb3AuthInner();
  return {
    initError,
    isConnected,
    isInitialized,
    isInitializing,
    provider,
    status,
    web3Auth,
    getPlugin,
  };
};
