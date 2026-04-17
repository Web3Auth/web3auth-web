import { type Ref, ref, type ShallowRef, shallowRef, watch } from "vue";

import { CONNECTED_STATUSES, CONNECTOR_STATUS_TYPE, EVM_PLUGINS, PLUGIN_EVENTS } from "../base";

type IWeb3AuthContextForWalletServices = {
  getPlugin: (pluginName: string) => unknown;
  isInitialized: Ref<boolean>;
  isConnected: Ref<boolean>;
};

type IWalletServicesPluginState<TWalletServicesPlugin> = TWalletServicesPlugin & {
  status?: string | null;
  on: (event: string, listener: () => void) => unknown;
  removeListener: (event: string, listener: () => void) => unknown;
};

export type IWalletServicesInnerContextValue<TWalletServicesPlugin> = {
  plugin: ShallowRef<TWalletServicesPlugin | null>;
  ready: Ref<boolean>;
  connecting: Ref<boolean>;
};

export function useWalletServicesInnerContextValue<TWalletServicesPlugin>(
  web3AuthContext: IWeb3AuthContextForWalletServices
): IWalletServicesInnerContextValue<TWalletServicesPlugin> {
  const { getPlugin, isInitialized, isConnected } = web3AuthContext;
  const walletServicesPlugin = shallowRef<TWalletServicesPlugin | null>(null);
  const ready = ref<boolean>(false);
  const connecting = ref<boolean>(false);

  watch(isInitialized, (newIsInitialized) => {
    if (newIsInitialized) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as TWalletServicesPlugin | null;
      walletServicesPlugin.value = plugin;
    }
  });

  watch(isConnected, (newIsConnected) => {
    if (newIsConnected) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as IWalletServicesPluginState<TWalletServicesPlugin> | null;
      walletServicesPlugin.value = plugin;
      // When rehydrating, the connected listener may be registered after the connected event is emitted.
      if (CONNECTED_STATUSES.includes(plugin?.status as CONNECTOR_STATUS_TYPE)) ready.value = true;
    }
  });

  watch(walletServicesPlugin, (newWalletServicesPlugin, prevWalletServicesPlugin) => {
    const connectedListener = () => {
      ready.value = true;
    };

    const disconnectedListener = () => {
      ready.value = false;
    };

    const connectingListener = () => {
      connecting.value = true;
    };

    const previousPlugin = prevWalletServicesPlugin as IWalletServicesPluginState<TWalletServicesPlugin> | null;
    const currentPlugin = newWalletServicesPlugin as IWalletServicesPluginState<TWalletServicesPlugin> | null;

    if (previousPlugin && currentPlugin !== previousPlugin) {
      previousPlugin.removeListener(PLUGIN_EVENTS.CONNECTED, connectedListener);
      previousPlugin.removeListener(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      previousPlugin.removeListener(PLUGIN_EVENTS.CONNECTING, connectingListener);
    }

    if (currentPlugin && currentPlugin !== previousPlugin) {
      currentPlugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
      currentPlugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      currentPlugin.on(PLUGIN_EVENTS.CONNECTING, connectingListener);
    }
  });

  return {
    plugin: walletServicesPlugin,
    ready,
    connecting,
  };
}
