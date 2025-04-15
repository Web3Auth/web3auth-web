import { useEffect, useState } from "react";

import { CONNECTOR_STATUS, EVM_PLUGINS, PLUGIN_EVENTS } from "@/core/base";
import { WalletServicesPluginType } from "@/core/wallet-services-plugin";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWalletServicesPlugin {
  isConnected: boolean;
  plugin: WalletServicesPluginType | null;
}

export const useWalletServicesPlugin = (): IUseWalletServicesPlugin => {
  const { web3Auth, isAuthenticated, isInitialized } = useWeb3AuthInner();
  const [isConnected, setIsConnected] = useState(false);
  const [plugin, setPlugin] = useState<WalletServicesPluginType | null>(null);

  useEffect(() => {
    if (isInitialized) {
      const plugin = web3Auth.getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
      setPlugin(plugin);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isAuthenticated) {
      const plugin = web3Auth.getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
      if (!plugin) setPlugin(plugin);
      // when rehydrating, the connectedListener may be registered after the connected event is emitted, we need to check the status here
      if (plugin?.status === CONNECTOR_STATUS.CONNECTED) setIsConnected(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const connectedListener = () => {
      setIsConnected(true);
    };

    const disconnectedListener = () => {
      setIsConnected(false);
    };

    if (plugin) {
      plugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
      plugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
    }

    return () => {
      if (plugin) {
        plugin.off(PLUGIN_EVENTS.CONNECTED, connectedListener);
        plugin.off(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      }
    };
  }, [plugin]);

  return { isConnected, plugin };
};
