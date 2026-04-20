import { createContext, createElement, PropsWithChildren } from "react";

import { Web3AuthNoModal } from "../../noModal";
import { IWeb3AuthInnerContext, Web3AuthProviderProps } from "../interfaces";
import { useWeb3AuthInnerContextValue } from "./useWeb3AuthInnerContextValue";

export const Web3AuthInnerContext = createContext<IWeb3AuthInnerContext>(null);

export function Web3AuthInnerProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config, initialState } = params;
  const { web3AuthOptions } = config;

  const value = useWeb3AuthInnerContextValue({
    Web3AuthConstructor: Web3AuthNoModal,
    web3AuthOptions,
    initialState,
  });

  return createElement(Web3AuthInnerContext.Provider, { value }, children);
}
