import { useEffect, useState } from "react";

import { CONNECTOR_STATUS, EVM_PLUGINS, PLUGIN_EVENTS } from "@/core/base";
import { WalletServicesPluginType } from "@/core/wallet-services-plugin";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWalletServicesPlugin {
  ready: boolean;
  connecting: boolean;
  plugin: WalletServicesPluginType | null;
}

export const useWalletServicesPlugin = (): IUseWalletServicesPlugin => {
  const { getPlugin, isConnected, isInitialized } = useWeb3AuthInner();
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [plugin, setPlugin] = useState<WalletServicesPluginType | null>(null);

  useEffect(() => {
    if (isInitialized) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
      setPlugin(plugin);
    }
  }, [isInitialized, getPlugin]);

  useEffect(() => {
    if (isConnected) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
      if (!plugin) setPlugin(plugin);
      // when rehydrating, the connectedListener may be registered after the connected event is emitted, we need to check the status here
      if (plugin?.status === CONNECTOR_STATUS.CONNECTED) setReady(true);
    }
  }, [isConnected, getPlugin]);

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

    // TODO: move to base web3auth inner
    if (plugin) {
      plugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
      plugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      plugin.on(PLUGIN_EVENTS.CONNECTING, connectingListener);
    }

    return () => {
      if (plugin) {
        plugin.off(PLUGIN_EVENTS.CONNECTED, connectedListener);
        plugin.off(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
        plugin.off(PLUGIN_EVENTS.CONNECTING, connectingListener);
      }
    };
  }, [plugin]);

  return { ready, plugin, connecting };
};
