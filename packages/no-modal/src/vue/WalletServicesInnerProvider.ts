import { defineComponent, h, provide, Ref, ref, shallowRef, watch } from "vue";

import { CONNECTOR_STATUS, EVM_PLUGINS, PLUGIN_EVENTS, WalletServicesPluginError } from "../base";
import { WalletServicesPluginType } from "../plugins/wallet-services-plugin";
import { useWeb3AuthInner } from "./composables/useWeb3AuthInner";
import { WalletServicesContextKey } from "./context";
import { IWalletServicesInnerContext } from "./interfaces";

export const WalletServicesInnerProvider = defineComponent({
  name: "WalletServicesInnerProvider",
  setup() {
    const web3AuthContext = useWeb3AuthInner();
    if (!web3AuthContext) throw WalletServicesPluginError.fromCode(1000, "`WalletServicesProvider` must be wrapped by `Web3AuthProvider`");

    const { getPlugin, isInitialized, isConnected } = web3AuthContext;

    const walletServicesPlugin = shallowRef<WalletServicesPluginType | null>(null);
    const ready = ref<boolean>(false);
    const connecting = ref<boolean>(false);

    watch(isInitialized, (newIsInitialized) => {
      if (newIsInitialized) {
        const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
        walletServicesPlugin.value = plugin;
      }
    });

    watch(isConnected, (newIsConnected) => {
      if (newIsConnected) {
        const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
        walletServicesPlugin.value = plugin;
        // when rehydrating, the connectedListener may be registered after the connected event is emitted, we need to check the status here
        if (walletServicesPlugin.value?.status === CONNECTOR_STATUS.CONNECTED) ready.value = true;
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

      // unregister previous listeners
      if (prevWalletServicesPlugin && newWalletServicesPlugin !== prevWalletServicesPlugin) {
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.CONNECTED, connectedListener);
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.CONNECTING, connectingListener);
      }

      if (newWalletServicesPlugin && newWalletServicesPlugin !== prevWalletServicesPlugin) {
        newWalletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
        newWalletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
        newWalletServicesPlugin.on(PLUGIN_EVENTS.CONNECTING, connectingListener);
      }
    });

    provide<IWalletServicesInnerContext>(WalletServicesContextKey, {
      plugin: walletServicesPlugin as Ref<WalletServicesPluginType | null>,
      ready,
      connecting,
    });
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});
