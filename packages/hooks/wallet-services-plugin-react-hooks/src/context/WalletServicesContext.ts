import { EVM_PLUGINS, IBaseWeb3AuthHookContext, PLUGIN_EVENTS, WalletServicesPluginError } from "@web3auth/base";
import { type WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { Context, createContext, createElement, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { IWalletServicesContext } from "../interfaces";

export const WalletServicesContext = createContext<IWalletServicesContext>(null);

export function WalletServicesContextProvider<T extends IBaseWeb3AuthHookContext>({ children, context }: PropsWithChildren<{ context: Context<T> }>) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin>(null);
  const web3AuthContext = useContext(context);

  useEffect(() => {
    const connectedListener = () => {
      setIsConnected(true);
    };

    const disconnectedListener = () => {
      setIsConnected(false);
    };

    const { getPlugin, isInitialized } = web3AuthContext;

    if (isInitialized) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
      setWalletServicesPlugin(plugin);
    }

    if (walletServicesPlugin) {
      walletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
      walletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
    }

    return () => {
      if (walletServicesPlugin) {
        walletServicesPlugin.off(PLUGIN_EVENTS.CONNECTED, connectedListener);
        walletServicesPlugin.off(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      }
    };
  }, [walletServicesPlugin, web3AuthContext]);

  const showWalletConnectScanner = useCallback(async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showWalletConnectScanner();
  }, [walletServicesPlugin, isConnected]);

  const showWalletUI = useCallback(async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showWalletUi();
  }, [walletServicesPlugin, isConnected]);

  const showCheckout = useCallback(async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showCheckout();
  }, [walletServicesPlugin, isConnected]);

  const value = useMemo(() => {
    return {
      plugin: walletServicesPlugin,
      isConnected,
      showWalletConnectScanner,
      showCheckout,
      showWalletUI,
    };
  }, [walletServicesPlugin, isConnected, showWalletConnectScanner, showCheckout, showWalletUI]);

  return createElement(WalletServicesContext.Provider, { value }, children);
}
