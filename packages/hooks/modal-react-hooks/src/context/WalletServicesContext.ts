import { PLUGIN_EVENTS, WalletServicesPluginError } from "@web3auth/base";
import { createContext, createElement, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";

import { useWeb3Auth } from "../hooks/useWeb3auth";
import { IWalletServicesContext } from "../interfaces";

export const WalletServicesContext = createContext<IWalletServicesContext>(null);

export function WalletServicesProvider({ children }: PropsWithChildren) {
  const { isConnected, walletServicesPlugin } = useWeb3Auth();
  const [walletSvcConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (walletServicesPlugin) {
      walletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, () => {
        setIsConnected(true);
      });
      walletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, () => {
        setIsConnected(false);
      });
    }

    return () => {
      if (walletServicesPlugin) {
        walletServicesPlugin.off(PLUGIN_EVENTS.CONNECTED, () => {
          setIsConnected(true);
        });
        walletServicesPlugin.off(PLUGIN_EVENTS.DISCONNECTED, () => {
          setIsConnected(false);
        });
      }
    };
  }, [walletServicesPlugin]);

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
      isConnected: walletSvcConnected,
      showWalletConnectScanner,
      showCheckout,
      showWalletUI,
    };
  }, [walletServicesPlugin, walletSvcConnected, showWalletConnectScanner, showCheckout, showWalletUI]);

  return createElement(WalletServicesContext.Provider, { value }, children);
}
