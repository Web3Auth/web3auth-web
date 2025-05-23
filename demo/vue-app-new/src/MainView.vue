<script setup lang="ts">
import {
  authConnector,
  CHAIN_NAMESPACES,
  type ConnectorFn,
  type CustomChainConfig,
  nftCheckoutPlugin,
  type PluginFn,
  storageAvailable,
  type UIConfig,
  WALLET_CONNECTORS,
  walletServicesPlugin,
  type AccountAbstractionMultiChainConfig,
  type Web3AuthOptions,
  type ConnectorsModalConfig,
  type LoginMethodConfig,
} from "@web3auth/modal";

import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/vue";
import { WagmiProvider } from "@web3auth/modal/vue/wagmi";
import { coinbaseConnector } from "@web3auth/no-modal/connectors/coinbase-connector";
import { computed, onBeforeMount, ref, watch } from "vue";

import { type AUTH_CONNECTION_TYPE, BUILD_ENV } from "@web3auth/auth";
import AppDashboard from "./components/AppDashboard.vue";
import AppHeader from "./components/AppHeader.vue";
import AppSettings from "./components/AppSettings.vue";
import { clientIds, NFT_CHECKOUT_CLIENT_ID } from "./config";
import { formDataStore } from "./store/form";
import { getChainConfig } from "./utils/chainconfig";
import { SmartAccountType } from "@toruslabs/ethereum-controllers";

const formData = formDataStore;

const externalConnectors = ref<ConnectorFn[]>([]);

const showAAProviderSettings = computed(() => formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155));

// Options for reinitializing the web3Auth object
const options = computed((): Web3AuthOptions => {
  const { config: whiteLabel, enable: enabledWhiteLabel } = formData.whiteLabel;

  // Account Abstraction
  const { useAccountAbstractionProvider } = formData;
  let accountAbstractionConfig: Web3AuthOptions["accountAbstractionConfig"];
  if (showAAProviderSettings.value && useAccountAbstractionProvider) {
    const chains: AccountAbstractionMultiChainConfig["chains"] = [];
    Object.entries(formData.smartAccountChainsConfig).forEach(([chainId, { bundlerUrl, paymasterUrl }]) => {
      if (formData.chains.includes(chainId)) {
        chains.push({
          chainId,
          bundlerConfig: { url: bundlerUrl },
          paymasterConfig: paymasterUrl ? { url: paymasterUrl } : undefined,
          smartAccountConfig: undefined,
        });
      }
    });
    accountAbstractionConfig = {
      smartAccountType: formData.smartAccountType as SmartAccountType,
      chains,
    };
  }

  // Wallet services settings
  let walletServicesConfig: Web3AuthOptions["walletServicesConfig"] = {
    // walletUrls: {
    //   production: {
    //     url: "http://localhost:4050",
    //   },
    // },
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

  const { widget, targetId } = formData;
  const uiConfig: Web3AuthOptions["uiConfig"] = enabledWhiteLabel
    ? { ...whiteLabel, widgetType: widget, targetId }
    : { widgetType: widget, targetId };
  const authConnectorInstance = authConnector({ connectorSettings: {} });

  return {
    clientId: clientIds[formData.network],
    web3AuthNetwork: formData.network,
    uiConfig: uiConfig as UIConfig,
    accountAbstractionConfig,
    useAAWithExternalWallet: formData.useAAWithExternalWallet,
    // TODO: Add more options
    // enableLogging?: boolean;
    // storageType?: "session" | "local";
    // sessionTime?: number;
    // useSFAKey?: boolean;
    chains,
    defaultChainId: formData.defaultChainId,
    enableLogging: true,
    authBuildEnv: BUILD_ENV.PRODUCTION, // Custom build env
    connectors: [...externalConnectors.value, authConnectorInstance],
    plugins,
    multiInjectedProviderDiscovery: formData.multiInjectedProviderDiscovery,
    walletServicesConfig,
    modalConfig: {
      connectors: modalParams.value,
      hideWalletDiscovery: !formData.showWalletDiscovery,
    },
  };
});

const loginMethodsConfig = computed(() => {
  const customConfig = {
    email_passwordless: {
      authConnectionId: `w3a-custom-email-${formData.network.replace("_", "-")}`,
    },
    sms_passwordless: {
      authConnectionId: `w3a-custom-sms-${formData.network.replace("_", "-")}`,
    },
  };
  if (formData.loginProviders.length === 0) return customConfig;

  // only show login methods that are configured
  const config = formData.loginProviders.reduce((acc, provider) => {
    acc[provider] = formData.loginMethods[provider];
    return acc;
  }, {} as LoginMethodConfig);

  if (config.email_passwordless) {
    config.email_passwordless.authConnectionId = `w3a-custom-email-${formData.network.replace("_", "-")}`;
  }
  if (config.sms_passwordless) {
    config.sms_passwordless.authConnectionId = `w3a-custom-sms-${formData.network.replace("_", "-")}`;
  }

  const loginMethods: LoginMethodConfig = JSON.parse(JSON.stringify(config));
  return loginMethods;
});

const modalParams = computed(() => {
  const modalConfig = {
    [WALLET_CONNECTORS.AUTH]: {
      label: "auth",
      loginMethods: loginMethodsConfig.value,
    },
  } as ConnectorsModalConfig["connectors"];
  return modalConfig;
});

const getExternalAdapterByName = (name: string): ConnectorFn[] => {
  switch (name) {
    case "coinbase":
      return [coinbaseConnector()];
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
        formData.smartAccountChains = json.smartAccountChains || [];
        formData.smartAccountChainsConfig = json.smartAccountChainsConfig || {};
        formData.defaultChainId = json.defaultChainId;
      }
    } catch (error) {}
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
    <WagmiProvider>
      <AppHeader />
      <div class="flex flex-col items-center justify-center">
        <main class="relative flex flex-col lg:h-[calc(100dvh_-_110px)]">
          <AppSettings />
          <AppDashboard :chains="options.chains || []" />
        </main>
      </div>
    </WagmiProvider>
  </Web3AuthProvider>
</template>
