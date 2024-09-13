import { EVM_PLUGINS, PLUGIN_EVENTS, WalletServicesPluginError } from "@web3auth/base";
import { useWeb3Auth } from "@web3auth/modal-vue-composables";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { ref, watch } from "vue";

export function useWalletServicesPlugin() {
  const { getPlugin, isInitialized } = useWeb3Auth();
  const walletServicesPlugin = ref<WalletServicesPlugin | null>(null);
  const isPluginConnected = ref<boolean>(false);

  watch(isInitialized, (newIsInitialized) => {
    if (newIsInitialized) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
      walletServicesPlugin.value = plugin;
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

  const showWalletConnectScanner = async () => {
    if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
    if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

    return walletServicesPlugin.value.showWalletConnectScanner();
  };

  const showWalletUI = async () => {
    if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
    if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

    return walletServicesPlugin.value.showWalletUi();
  };

  const showCheckout = async () => {
    if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
    if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

    return walletServicesPlugin.value.showCheckout();
  };

  return {
    isPluginConnected,
    showWalletConnectScanner,
    showCheckout,
    showWalletUI,
  };
}
