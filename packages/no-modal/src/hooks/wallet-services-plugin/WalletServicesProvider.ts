// eslint-disable-next-line import/no-extraneous-dependencies
import { type Context, createElement, type PropsWithChildren } from "react";

import { type IBaseWeb3AuthHookContext } from "@/core/base";

import { WalletServicesContextProvider } from "./WalletServicesContext";

export function WalletServicesProvider<T extends IBaseWeb3AuthHookContext>({ children, context }: PropsWithChildren<{ context: Context<T> }>) {
  const wsElement = createElement(WalletServicesContextProvider<T>, { context }, children);
  return wsElement;
}
