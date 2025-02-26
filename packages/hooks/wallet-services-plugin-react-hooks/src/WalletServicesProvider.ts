import { IBaseWeb3AuthHookContext } from "@web3auth/base";
import { Context, createElement, PropsWithChildren } from "react";

import { WalletServicesContextProvider } from "./context/WalletServicesContext";

export function WalletServicesProvider<T extends IBaseWeb3AuthHookContext>({ children, context }: PropsWithChildren<{ context: Context<T> }>) {
  const wsElement = createElement(WalletServicesContextProvider<T>, { context }, children);
  return wsElement;
}
