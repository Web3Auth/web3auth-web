import { PLUGIN_EVENTS, WalletServicesPluginError } from "@web3auth/base";
import { type WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { useContext, useEffect, useState } from "react";

import { Web3AuthContext } from "./Web3AuthProvider";

const WALLET_SERVICES_PLUGIN_NAME = "WALLET_SERVICES_PLUGIN";

export const useWalletServicesPlugin = () => {
  const web3auth = useContext(Web3AuthContext);

  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (web3auth) {
      const plugin = web3auth.getPlugin(WALLET_SERVICES_PLUGIN_NAME) as WalletServicesPlugin | null;
      if (plugin) setWalletServicesPlugin(plugin);
    }
  }, [web3auth]);

  useEffect(() => {
    if (walletServicesPlugin) {
      walletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, () => {
        setIsConnected(true);
      });
      walletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, () => {
        setIsConnected(false);
      });
    }
  }, [walletServicesPlugin]);

  const showWalletConnectScanner = async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showWalletConnectScanner();
  };

  const showWalletUI = async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showWalletUi();
  };

  const showCheckout = async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showCheckout();
  };

  return {
    plugin: walletServicesPlugin,
    isConnected,
    showWalletConnectScanner,
    showCheckout,
    showWalletUI,
  };
};
