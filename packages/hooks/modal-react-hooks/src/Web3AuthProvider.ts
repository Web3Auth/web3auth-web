import { createElement, PropsWithChildren } from "react";

import { WalletServicesProvider } from "./context/WalletServicesContext";
import { Web3AuthInnerProvider } from "./context/Web3AuthInnerContext";
import { Web3AuthProviderProps } from "./interfaces";

export function Web3AuthProvider({ config, children }: PropsWithChildren<Web3AuthProviderProps>) {
  const wsElement = createElement(WalletServicesProvider, {}, children);
  return createElement(Web3AuthInnerProvider, { config }, wsElement);
}
