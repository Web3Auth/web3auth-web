import { useEffect, useMemo, useState } from "react";

import { CONNECTED_STATUSES, type CONNECTOR_STATUS_TYPE, EVM_PLUGINS, PLUGIN_EVENTS } from "../../base";

type IWeb3AuthContextForWalletServices = {
  getPlugin: (name: string) => unknown;
  isInitialized: boolean;
  isConnected: boolean;
};

type IWalletServicesPluginState<TWalletServicesPlugin> = TWalletServicesPlugin & {
  status?: CONNECTOR_STATUS_TYPE | null;
  on: (event: string, listener: () => void) => unknown;
  removeListener: (event: string, listener: () => void) => unknown;
};

export type IWalletServicesContextValue<TWalletServicesPlugin> = {
  plugin: TWalletServicesPlugin | null;
  ready: boolean;
  connecting: boolean;
};

export function useWalletServicesContextValue<TWalletServicesPlugin>(
  web3AuthContext: IWeb3AuthContextForWalletServices
): IWalletServicesContextValue<TWalletServicesPlugin> {
  const { getPlugin, isInitialized, isConnected } = web3AuthContext;
  const [ready, setReady] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<TWalletServicesPlugin | null>(null);

  useEffect(() => {
    if (!isInitialized) return;

    const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as TWalletServicesPlugin | null;
    setWalletServicesPlugin(plugin);
  }, [isInitialized, getPlugin]);

  useEffect(() => {
    if (!isConnected) return;

    const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as IWalletServicesPluginState<TWalletServicesPlugin> | null;
    setWalletServicesPlugin(plugin);
    // When rehydrating, the connected listener may be registered after the connected event is emitted.
    if (CONNECTED_STATUSES.includes(plugin?.status)) setReady(true);
  }, [isConnected, getPlugin]);

  useEffect(() => {
    const plugin = walletServicesPlugin as IWalletServicesPluginState<TWalletServicesPlugin> | null;
    if (!plugin) return undefined;

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

    plugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
    plugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
    plugin.on(PLUGIN_EVENTS.CONNECTING, connectingListener);

    return () => {
      plugin.removeListener(PLUGIN_EVENTS.CONNECTED, connectedListener);
      plugin.removeListener(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      plugin.removeListener(PLUGIN_EVENTS.CONNECTING, connectingListener);
    };
  }, [walletServicesPlugin]);

  return useMemo(() => {
    return {
      plugin: walletServicesPlugin,
      ready,
      connecting,
    };
  }, [walletServicesPlugin, ready, connecting]);
}
