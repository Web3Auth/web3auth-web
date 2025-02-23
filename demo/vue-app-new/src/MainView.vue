<script setup lang="ts">

import { CHAIN_NAMESPACES, ChainNamespaceType, coinbaseConnector, ConnectorFn, nftCheckoutPlugin, PluginFn, storageAvailable, WALLET_CONNECTORS, walletConnectV2Connector, walletServicesPlugin, type Web3AuthOptions } from "@web3auth/modal";
import { Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/vue";
import { WalletServicesProvider } from "@web3auth/no-modal/vue";
import { computed, onBeforeMount, ref, watch } from "vue";

import AppDashboard from "./components/AppDashboard.vue";
import AppHeader from "./components/AppHeader.vue";
import AppSettings from "./components/AppSettings.vue";
import { chainConfigs, clientIds, getDefaultBundlerUrl, NFT_CHECKOUT_CLIENT_ID } from "./config";
import { formDataStore } from "./store/form";

const formData = formDataStore;

const externalConnectors = ref<ConnectorFn[]>([]);

const chainOptions = computed(() =>
  chainConfigs[formData.chainNamespace as ChainNamespaceType].map((x) => ({
    name: `${x.chainId} ${x.tickerName}`,
    value: x.chainId,
  }))
);

const showAAProviderSettings = computed(() => formData.chainNamespace === CHAIN_NAMESPACES.EIP155);

// Options for reinitializing the web3Auth object
const options = computed((): Web3AuthOptions => {
  const { config: whiteLabel, enable: enabledWhiteLabel } = formData.whiteLabel;
  const chainConfig = chainConfigs[formData.chainNamespace as ChainNamespaceType].find((x) => x.chainId === formData.chain)!;

  // Account Abstraction
  const { useAccountAbstractionProvider } = formData;
  let accountAbstractionConfig: Web3AuthOptions["accountAbstractionConfig"];
  if (showAAProviderSettings.value && useAccountAbstractionProvider) {
    accountAbstractionConfig = {
      smartAccountType: formData.smartAccountType as string,
      smartAccountConfig: undefined,
      bundlerConfig: { url: formData.bundlerUrl ?? getDefaultBundlerUrl(chainConfig.chainId) },
      paymasterConfig: formData.paymasterUrl ? { url: formData.paymasterUrl } : undefined,
    }
  }

  // Wallet services settings
  let walletServicesConfig: Web3AuthOptions["walletServicesConfig"];
  const uiConfig = enabledWhiteLabel ? { ...whiteLabel } : undefined;
  if (formData.walletPlugin.enable) {
    const { confirmationStrategy } = formData.walletPlugin;
    walletServicesConfig = {
      whiteLabel: {
        ...uiConfig,
        showWidgetButton: true,
      },
      confirmationStrategy,
    };
  }

  // Plugins
  const plugins: PluginFn[] = [];
  if (formData.chainNamespace === CHAIN_NAMESPACES.EIP155 || formData.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    if (formData.nftCheckoutPlugin.enable && formData.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      plugins.push(nftCheckoutPlugin({ clientId: NFT_CHECKOUT_CLIENT_ID }));
    }
    if (formData.walletPlugin.enable) {
      plugins.push(walletServicesPlugin());
    }
  }


  return {
    clientId: clientIds[formData.network],
    web3AuthNetwork: formData.network,
    uiConfig,
    accountAbstractionConfig,
    useAAWithExternalWallet: formData.useAAWithExternalWallet,
    // TODO: Add more options
    // chainConfig?: CustomChainConfig;
    // enableLogging?: boolean;
    // storageKey?: "session" | "local";
    // sessionTime?: number;
    // useCoreKitKey?: boolean;
    // chainConfig,
    chains: [chainConfig, chainConfigs.eip155.find((x) => x.chainId === "0xaa36a7")!],
    enableLogging: true,
    connectors: externalConnectors.value,
    plugins,
    multiInjectedProviderDiscovery: formData.multiInjectedProviderDiscovery,
    walletServicesConfig,
  };
});

const loginMethodsConfig = computed(() => {
  if (formData.loginProviders.length === 0) return undefined;

  if (!Object.values(formData.loginMethods).some((x) => x.showOnModal)) {
    return undefined;
  }

  const loginMethods = JSON.parse(JSON.stringify(formData.loginMethods));
  return loginMethods;
});

const modalParams = computed(() => {
  const modalConfig = {
    [WALLET_CONNECTORS.AUTH]: {
      label: "auth",
      loginMethods: loginMethodsConfig.value,
    },
  };
  return modalConfig;
});

const getExternalAdapterByName = (name: string): ConnectorFn[] => {
  switch (name) {
    case "coinbase":
      return [coinbaseConnector()];
    case "wallet-connect-v2":
      return [walletConnectV2Connector({ projectId: "d3c63f19f9582f8ba48e982057eb096b" })];
    default:
      return [];
  }
};

onBeforeMount(() => {
  if (storageAvailable("sessionStorage")) {
    const storedValue = sessionStorage.getItem("state");
    try {
      if (storedValue) {
        // console.log("storedValue", storedValue);
        const json = JSON.parse(storedValue);
        formData.connectors = json.connectors;
        formData.chain = json.chain;
        formData.chainNamespace = json.chainNamespace;
        formData.loginProviders = json.loginProviders;
        formData.showWalletDiscovery = json.showWalletDiscovery;
        formData.multiInjectedProviderDiscovery = json.multiInjectedProviderDiscovery;
        formData.network = json.network;
        formData.whiteLabel = json.whiteLabel;
        formData.walletPlugin = json.walletPlugin;
        formData.nftCheckoutPlugin = json.nftCheckoutPlugin || {};
        formData.useAccountAbstractionProvider = json.useAccountAbstractionProvider;
        formData.smartAccountType = json.smartAccountType;
        formData.bundlerUrl = json.bundlerUrl;
        formData.paymasterUrl = json.paymasterUrl;
      }
    } catch (error) { }
  }
  if (!chainOptions.value.find((option) => option.value === formData.chain)) formData.chain = chainOptions.value[0]?.value;
});

watch(formData, () => {
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(formData));
});

// Every time the form data changes, reinitialize the web3Auth object
watch(
  () => formData.connectors,
  async () => {
    let connectors: ConnectorFn[] = [];
    for (let i = 0; i <= formData.connectors.length; i += 1) {
      connectors = connectors.concat(getExternalAdapterByName(formData.connectors[i]));
    }
    externalConnectors.value = connectors;
  }
);

const configs = computed<Web3AuthContextConfig>(() => {
  return {
    web3AuthOptions: options.value,
    modalConfig: modalParams.value,
    hideWalletDiscovery: !formData.showWalletDiscovery,
  };
});
</script>

<template>
  <Web3AuthProvider :config="configs">
    <WalletServicesProvider>
      <AppHeader />
      <main class="relative flex flex-col lg:h-[calc(100dvh_-_110px)]">
        <AppSettings />
        <AppDashboard />
      </main>
    </WalletServicesProvider>
  </Web3AuthProvider>
</template>
