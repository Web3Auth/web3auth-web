import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { defineComponent, h, inject, provide, Ref, ref, watch } from "vue";

import { CONNECTOR_STATUS, EVM_PLUGINS, IPlugin, PLUGIN_EVENTS, WalletServicesPluginError, Web3AuthContextKey } from "@/core/base";
import { type WalletServicesPluginType } from "@/core/wallet-services-plugin";

import { WalletServicesContextKey } from "./context";
import { IWalletServicesContext } from "./interfaces";

interface IWeb3AuthContext {
  isInitialized: Ref<boolean>;
  isConnected: Ref<boolean>;
  getPlugin(pluginName: string): IPlugin | null;
}

export const WalletServicesProvider = defineComponent({
  name: "WalletServicesProvider",
  setup() {
    const web3AuthContext = inject<IWeb3AuthContext>(Web3AuthContextKey);
    if (!web3AuthContext) throw WalletServicesPluginError.fromCode(1000, "`WalletServicesProvider` must be wrapped by `Web3AuthProvider`");

    const { getPlugin, isInitialized, isConnected } = web3AuthContext;

    const walletServicesPlugin = ref<WalletServicesPluginType | null>(null);
    const isPluginConnected = ref<boolean>(false);

    watch(isInitialized, (newIsInitialized) => {
      if (newIsInitialized) {
        const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
        walletServicesPlugin.value = plugin;
      }
    });

    watch(isConnected, (newIsConnected) => {
      if (newIsConnected) {
        const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPluginType;
        if (!walletServicesPlugin.value) walletServicesPlugin.value = plugin;
        // when rehydrating, the connectedListener may be registered after the connected event is emitted, we need to check the status here
        if (walletServicesPlugin.value?.status === CONNECTOR_STATUS.CONNECTED) isPluginConnected.value = true;
      }
    });

    watch(walletServicesPlugin, (newWalletServicesPlugin, prevWalletServicesPlugin) => {
      const connectedListener = () => {
        isPluginConnected.value = true;
      };

      const disconnectedListener = () => {
        isPluginConnected.value = false;
      };

      // unregister previous listeners
      if (prevWalletServicesPlugin && newWalletServicesPlugin !== prevWalletServicesPlugin) {
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.CONNECTED, connectedListener);
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      }

      if (newWalletServicesPlugin && newWalletServicesPlugin !== prevWalletServicesPlugin) {
        newWalletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
        newWalletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      }
    });

    const showWalletConnectScanner = async (showWalletConnectScannerParams?: BaseEmbedControllerState["showWalletConnect"]) => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showWalletConnectScanner(showWalletConnectScannerParams);
    };

    const showWalletUI = async (showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]) => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showWalletUi(showWalletUiParams);
    };

    const showCheckout = async (showCheckoutParams?: BaseEmbedControllerState["showCheckout"]) => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showCheckout(showCheckoutParams);
    };

    const showSwap = async (showSwapParams?: BaseEmbedControllerState["showSwap"]) => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showSwap(showSwapParams);
    };

    provide<IWalletServicesContext>(WalletServicesContextKey, {
      plugin: walletServicesPlugin as Ref<WalletServicesPluginType | null>,
      isPluginConnected,
      showWalletConnectScanner,
      showCheckout,
      showWalletUI,
      showSwap,
    });
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});
