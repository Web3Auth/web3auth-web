import { IBaseWeb3AuthHookContext } from "@web3auth/base";
import { Context, createElement, PropsWithChildren } from "react";

import { WalletServicesContextProvider } from "./context/WalletServicesContext";

export function WalletServicesProvider({ children, context }: PropsWithChildren<{ context: Context<IBaseWeb3AuthHookContext> }>) {
  const wsElement = createElement(WalletServicesContextProvider, { context }, children);
  return wsElement;
}
