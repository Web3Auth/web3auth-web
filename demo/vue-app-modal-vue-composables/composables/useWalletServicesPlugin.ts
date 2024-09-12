import { EVM_PLUGINS, PLUGIN_EVENTS, WalletServicesPluginError } from "@web3auth/base";
import { useWeb3Auth } from "@web3auth/modal-vue-composables";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { ref, watch } from "vue";

export function useWalletServicesPlugin() {
  const { getPlugin, isInitialized } = useWeb3Auth();
  const walletServicesPlugin = ref<WalletServicesPlugin | null>(null);
  const isPluginConnected = ref<boolean>(false);

  watch(isInitialized, (newIsInitialized) => {
    const connectedListener = () => {
      isPluginConnected.value = true;
    };

    const disconnectedListener = () => {
      isPluginConnected.value = false;
    };

    if (newIsInitialized) {
      const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
      walletServicesPlugin.value = plugin;
    }

    if (walletServicesPlugin.value) {
      walletServicesPlugin.value.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
      walletServicesPlugin.value.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
    }

    // TODO: handle off case disconnect listeners
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
