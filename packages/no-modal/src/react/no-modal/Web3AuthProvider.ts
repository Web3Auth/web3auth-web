import { createElement, type PropsWithChildren } from "react";

import { WalletServicesContextProvider } from "./context/WalletServicesInnerContext";
import { Web3AuthInnerContext, Web3AuthInnerProvider } from "./context/Web3AuthInnerContext";
import { Web3AuthProviderProps } from "./interfaces";

export function Web3AuthProvider({ config, children }: PropsWithChildren<Web3AuthProviderProps>) {
  return createElement(Web3AuthInnerProvider, { config }, createElement(WalletServicesContextProvider, { context: Web3AuthInnerContext }, children));
}
