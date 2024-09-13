<script setup lang="ts">
import { EVM_PLUGINS, PLUGIN_EVENTS, WalletServicesPluginError } from '@web3auth/base';
import { WalletServicesPlugin } from '@web3auth/wallet-services-plugin';
import { inject, InjectionKey, provide, Ref, ref, watch } from 'vue';
import { IWalletServicesContext } from '../interfaces';
import { IWeb3AuthContext } from '@web3auth/modal-vue-composables';
// TODO: don't import from modal/no-modal since we dont know which one the plugin will be used with

const props = defineProps<{ web3AuthContextKey: InjectionKey<IWeb3AuthContext> }>()
const web3AuthContext = inject(props.web3AuthContextKey)
// TODO: what error should be here?
if (!web3AuthContext) throw WalletServicesPluginError.fromCode(1000, "`WalletServicesProvider` must be wrapped by `Web3AuthProvider`");

const { getPlugin, isInitialized } = web3AuthContext

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

provide<IWalletServicesContext>('wallet_services', {
    plugin: walletServicesPlugin as Ref<WalletServicesPlugin| null>,
    isPluginConnected,
    showWalletConnectScanner,
    showCheckout,
    showWalletUI,
})
</script>

<template>
  <slot />
</template>