import { createElement, PropsWithChildren } from "react";

import { WalletServicesContextProvider } from "./context/WalletServicesInnerContext";
import { Web3AuthInnerContext, Web3AuthInnerProvider } from "./context/Web3AuthInnerContext";
import { Web3AuthProviderProps } from "./interfaces";

export function Web3AuthProvider({ config, initialState, children }: PropsWithChildren<Web3AuthProviderProps>) {
  const pluginChild = createElement(WalletServicesContextProvider, { context: Web3AuthInnerContext }, children);
  return createElement(Web3AuthInnerProvider, { config, initialState }, pluginChild);
}
