import { Context, createContext, createElement, PropsWithChildren, useContext } from "react";

import { type WalletServicesPluginType } from "../../plugins/wallet-services-plugin";
import { IWalletServicesContext, IWeb3AuthInnerContext } from "../interfaces";
import { useWalletServicesContextValue } from "./useWalletServicesContextValue";

export const WalletServicesContext = createContext<IWalletServicesContext>(null);

export function WalletServicesContextProvider({ children, context }: PropsWithChildren<{ context: Context<IWeb3AuthInnerContext> }>) {
  const web3AuthContext = useContext(context);
  const value = useWalletServicesContextValue<WalletServicesPluginType>(web3AuthContext);

  return createElement(WalletServicesContext.Provider, { value }, children);
}
