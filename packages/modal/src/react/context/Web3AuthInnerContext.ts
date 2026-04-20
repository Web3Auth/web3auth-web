import { useWeb3AuthInnerContextValue, Web3AuthInnerContext as Web3AuthInnerContextNoModal } from "@web3auth/no-modal/react";
import { createElement, PropsWithChildren } from "react";

import { Web3Auth } from "../../modalManager";
import { Web3AuthProviderProps } from "../interfaces";

export { Web3AuthInnerContextNoModal as Web3AuthInnerContext };

export function Web3AuthInnerProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config, initialState } = params;
  const { web3AuthOptions } = config;
  const value = useWeb3AuthInnerContextValue({
    Web3AuthConstructor: Web3Auth,
    web3AuthOptions,
    initialState,
    notReadyUsesCurrentStatus: true,
    cleanupOnUnmount: true,
    initEffectDependency: config,
  });

  return createElement(Web3AuthInnerContextNoModal.Provider, { value }, children);
}
