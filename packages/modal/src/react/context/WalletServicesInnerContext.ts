import { CONNECTED_STATUSES, EVM_PLUGINS, PLUGIN_EVENTS } from "@web3auth/no-modal";
import { type WalletServicesPluginType } from "@web3auth/no-modal";
import { Context, createContext, createElement, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { IWalletServicesContext, IWeb3AuthInnerContext } from "../interfaces";

export const WalletServicesContext = createContext<IWalletServicesContext>(null);

export function WalletServicesContextProvider({ children, context }: PropsWithChildren<{ context: Context<IWeb3AuthInnerContext> }>) {
  const web3AuthContext = useContext(context);
  const { getPlugin, isInitialized, isConnected } = web3AuthContext;

  const [ready, setReady] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPluginType>(null);

  useEffect(() => {
    if (isInitialized) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
      setWalletServicesPlugin(plugin);
    }
  }, [isInitialized, getPlugin]);

  useEffect(() => {
    if (isConnected) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
      setWalletServicesPlugin(plugin);
      // when rehydrating, the connectedListener may be registered after the connected event is emitted, we need to check the status here
      if (CONNECTED_STATUSES.includes(plugin?.status)) setReady(true);
    }
  }, [isConnected, getPlugin, walletServicesPlugin]);

  useEffect(() => {
    const connectedListener = () => {
      setReady(true);
      setConnecting(false);
    };

    const disconnectedListener = () => {
      setReady(false);
      setConnecting(false);
    };

    const connectingListener = () => {
      setConnecting(true);
    };

    if (walletServicesPlugin) {
      walletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
      walletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      walletServicesPlugin.on(PLUGIN_EVENTS.CONNECTING, connectingListener);
    }

    return () => {
      if (walletServicesPlugin) {
        walletServicesPlugin.removeListener(PLUGIN_EVENTS.CONNECTED, connectedListener);
        walletServicesPlugin.removeListener(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
        walletServicesPlugin.removeListener(PLUGIN_EVENTS.CONNECTING, connectingListener);
      }
    };
  }, [walletServicesPlugin]);

  const value = useMemo(() => {
    return {
      plugin: walletServicesPlugin,
      ready,
      connecting,
    };
  }, [walletServicesPlugin, ready, connecting]);

  return createElement(WalletServicesContext.Provider, { value }, children);
}
