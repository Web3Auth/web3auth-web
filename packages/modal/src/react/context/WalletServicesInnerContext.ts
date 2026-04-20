import { type WalletServicesPluginType } from "@web3auth/no-modal";
import { useWalletServicesContextValue, WalletServicesContext as WalletServicesContextNoModal } from "@web3auth/no-modal/react";
import { type Context, createElement, PropsWithChildren, useContext } from "react";

import { type IWalletServicesContext } from "../interfaces";

type IWeb3AuthContextForWalletServices = {
  getPlugin: (name: string) => unknown;
  isInitialized: boolean;
  isConnected: boolean;
};

type WalletServicesContextProviderProps<TWeb3AuthContext extends IWeb3AuthContextForWalletServices> = PropsWithChildren<{
  context: Context<TWeb3AuthContext>;
}>;

export const WalletServicesContext = WalletServicesContextNoModal as Context<IWalletServicesContext>;

export function WalletServicesContextProvider<TWeb3AuthContext extends IWeb3AuthContextForWalletServices>({
  children,
  context,
}: WalletServicesContextProviderProps<TWeb3AuthContext>) {
  const web3AuthContext = useContext(context);
  const value = useWalletServicesContextValue<WalletServicesPluginType>(web3AuthContext);

  return createElement(WalletServicesContext.Provider, { value }, children);
}
