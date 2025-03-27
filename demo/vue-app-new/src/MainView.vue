<script setup lang="ts">

import { authConnector, CHAIN_NAMESPACES, coinbaseConnector, ConnectorFn, CustomChainConfig, getChainConfig, nftCheckoutPlugin, PluginFn, storageAvailable, UX_MODE, WALLET_CONNECTORS, walletConnectV2Connector, walletServicesPlugin, type Web3AuthOptions } from "@web3auth/modal";
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

const showAAProviderSettings = computed(() => formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155));

// Options for reinitializing the web3Auth object
const options = computed((): Web3AuthOptions => {
  const { config: whiteLabel, enable: enabledWhiteLabel } = formData.whiteLabel;
  // TODO: AA config need multi chain support
  const evmChainIds = chainConfigs[CHAIN_NAMESPACES.EIP155].filter((x) => formData.chains.includes(x));
  const firstEvmChainId = evmChainIds[0];

  // Account Abstraction
  const { useAccountAbstractionProvider } = formData;
  let accountAbstractionConfig: Web3AuthOptions["accountAbstractionConfig"];
  if (showAAProviderSettings.value && useAccountAbstractionProvider) {
    accountAbstractionConfig = {
      smartAccountType: formData.smartAccountType as string,
      smartAccountConfig: undefined,
      bundlerConfig: { url: formData.bundlerUrl ?? getDefaultBundlerUrl(firstEvmChainId) },
      paymasterConfig: formData.paymasterUrl ? { url: formData.paymasterUrl } : undefined,
    }
  }

  // Wallet services settings
  let walletServicesConfig: Web3AuthOptions["walletServicesConfig"] = {
    // walletUrls: {
    //   production: {
    //     url: "http://localhost:4050",
    //   }
    // }
  };
  if (formData.walletPlugin.enable) {
    const { confirmationStrategy } = formData.walletPlugin;
    walletServicesConfig = {
      ...walletServicesConfig,
      whiteLabel: { showWidgetButton: true },
      confirmationStrategy,
    };
  }

  // Plugins
  const plugins: PluginFn[] = [];
  if (formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155) || formData.chainNamespaces.includes(CHAIN_NAMESPACES.SOLANA)) {
    if (formData.nftCheckoutPlugin.enable && formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155)) {
      plugins.push(nftCheckoutPlugin({ clientId: NFT_CHECKOUT_CLIENT_ID }));
    }
    if (formData.walletPlugin.enable) {
      plugins.push(walletServicesPlugin());
    }
  }

  // Chains
  const chains: CustomChainConfig[] = [];
  for (const namespace of formData.chainNamespaces) {
    for (const chainId of formData.chains) {
      const chain = getChainConfig(namespace, chainId, clientIds[formData.network]);
      if (!chain) continue;
      // we need to validate chain id as legacy Solana chainIds 0x1, 0x2, 0x3 are not valid anymore
      if (chain.chainId !== chainId) continue;
      if (namespace === CHAIN_NAMESPACES.SOLANA) {
        if (chainId === "0x65") {
          chain.rpcTarget = import.meta.env.VITE_APP_SOLANA_MAINNET_RPC || chain.rpcTarget;
        } else if (chainId === "0x66") {
          chain.rpcTarget = import.meta.env.VITE_APP_SOLANA_TESTNET_RPC || chain.rpcTarget;
        } else if (chainId === "0x67") {
          chain.rpcTarget = import.meta.env.VITE_APP_SOLANA_DEVNET_RPC || chain.rpcTarget;
        }
      }
      chains.push(chain);
    }
  }

  const uiConfig = enabledWhiteLabel ? { ...whiteLabel } : undefined;
  const authConnectorInstance = authConnector({ connectorSettings: { buildEnv: "testing" } });
  return {
    clientId: clientIds[formData.network],
    web3AuthNetwork: formData.network,
    uiConfig,
    accountAbstractionConfig,
    useAAWithExternalWallet: formData.useAAWithExternalWallet,
    // TODO: Add more options
    // enableLogging?: boolean;
    // storageType?: "session" | "local";
    // sessionTime?: number;
    // useCoreKitKey?: boolean;
    chains,
    defaultChainId: formData.defaultChainId,
    enableLogging: true,
    connectors: [...externalConnectors.value, authConnectorInstance],
    plugins,
    multiInjectedProviderDiscovery: formData.multiInjectedProviderDiscovery,
    walletServicesConfig,
    modalConfig: {
      connectors: modalParams.value,
      hideWalletDiscovery: !formData.showWalletDiscovery,
    }
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
      return [walletConnectV2Connector()];
    default:
      return [];
  }
};

onBeforeMount(() => {
  if (storageAvailable("sessionStorage")) {
    const storedValue = sessionStorage.getItem("state");
    try {
      if (storedValue) {
        const json = JSON.parse(storedValue);
        formData.connectors = json.connectors;
        formData.chains = json.chains;
        formData.chainNamespaces = json.chainNamespaces;
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
  };
});
</script>

<template>
  <Web3AuthProvider :config="configs">
    <WalletServicesProvider>
      <AppHeader />
      <main class="relative flex flex-col lg:h-[calc(100dvh_-_110px)]">
        <AppSettings />
        <AppDashboard :chains="options.chains || []" />
      </main>
    </WalletServicesProvider>
  </Web3AuthProvider>
</template>
