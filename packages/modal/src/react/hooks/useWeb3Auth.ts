import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IUseWeb3Auth = Omit<IWeb3AuthInnerContext, "isMFAEnabled" | "setIsMFAEnabled">;

export const useWeb3Auth = (): IUseWeb3Auth => {
  const { initError, isConnected, isAuthorized, isInitialized, isInitializing, connection, status, web3Auth, getPlugin, currentChainIds } =
    useWeb3AuthInner();
  return {
    initError,
    isConnected,
    isAuthorized,
    isInitialized,
    isInitializing,
    connection,
    status,
    web3Auth,
    getPlugin,
    currentChainIds,
  };
};
