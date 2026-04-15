import { useWeb3Auth as useSharedWeb3Auth } from "@web3auth/no-modal/react";

import { IWeb3AuthInnerContext } from "../interfaces";

export type IUseWeb3Auth = Omit<IWeb3AuthInnerContext, "isMFAEnabled" | "setIsMFAEnabled" | "chainId" | "chainNamespace">;

export const useWeb3Auth = (): IUseWeb3Auth => {
  const { initError, isConnected, isAuthorized, isInitialized, isInitializing, connection, status, web3Auth, getPlugin } =
    useSharedWeb3Auth() as Omit<IWeb3AuthInnerContext, "isMFAEnabled" | "setIsMFAEnabled">;
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
  };
};
