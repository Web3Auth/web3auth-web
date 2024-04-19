import { PLUGIN_EVENTS } from "@web3auth/base-plugin";
import { type WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { useContext, useEffect, useState } from "react";

import { Web3AuthContext } from "./Web3AuthProvider";

const WAIT_FOR_INIT_MSG = "Wait for wallet services plugin to initialize.";

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
    if (!walletServicesPlugin) throw new Error(WAIT_FOR_INIT_MSG);
    if (!isConnected) throw new Error("Wallet services plugin is not connected.");

    return walletServicesPlugin.showWalletConnectScanner();
  };

  const showWalletUI = async () => {
    if (!walletServicesPlugin) throw new Error(WAIT_FOR_INIT_MSG);
    if (!isConnected) throw new Error("Wallet services plugin is not connected.");

    return walletServicesPlugin.showWalletUi();
  };

  const showCheckout = async () => {
    if (!walletServicesPlugin) throw new Error(WAIT_FOR_INIT_MSG);
    if (!isConnected) throw new Error("Wallet services plugin is not connected.");

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
