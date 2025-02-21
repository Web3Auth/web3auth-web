<script setup lang="ts">

import { AccountAbstractionProvider, ConnectorFn, CHAIN_NAMESPACES, ChainNamespaceType, coinbaseConnector, IBaseProvider, IProvider, ISmartAccount, KernelSmartAccount, NexusSmartAccount, NFTCheckoutPlugin, SafeSmartAccount, storageAvailable, TrustSmartAccount, WALLET_CONNECTORS, walletConnectV2Connector, WalletServicesPlugin, type Web3AuthOptions } from "@web3auth/modal";
import { Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/vue";
import { WalletServicesProvider } from "@web3auth/no-modal/vue";
import { computed, onBeforeMount, ref, watch } from "vue";

import { SMART_ACCOUNT } from "@toruslabs/ethereum-controllers";
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

const accountAbstractionProvider = computed((): IBaseProvider<IProvider> | undefined => {
  const { useAccountAbstractionProvider } = formData;
  if (!showAAProviderSettings.value || !useAccountAbstractionProvider) return undefined;

  // only need to setup AA provider for external wallets, for embedded wallet, we'll use WS which already supports AA
  if (!formData.useAAWithExternalWallet) return undefined;

  const chainConfig = chainConfigs[formData.chainNamespace as ChainNamespaceType].find((x) => x.chainId === formData.chain)!;
  // setup aa provider
  let smartAccountInit: ISmartAccount;
  switch (formData.smartAccountType) {
    case "nexus":
      smartAccountInit = new NexusSmartAccount();
      break;
    case "kernel":
      smartAccountInit = new KernelSmartAccount();
      break;
    case "trust":
      smartAccountInit = new TrustSmartAccount();
      break;
    // case "light":
    //   smartAccountInit = new LightSmartAccount();
    //   break;
    // case "simple":
    //   smartAccountInit = new SimpleSmartAccount();
    //   break;
    case "safe":
    default:
      smartAccountInit = new SafeSmartAccount();
      break;
  }

  return new AccountAbstractionProvider({
    config: {
      chainConfig,
      bundlerConfig: { url: formData.bundlerUrl ?? getDefaultBundlerUrl(chainConfig.chainId) },
      paymasterConfig: formData.paymasterUrl
        ? {
          url: formData.paymasterUrl,
        }
        : undefined,
      smartAccountInit,
    },
  });
});

// Options for reinitializing the web3Auth object
const options = computed((): Web3AuthOptions => {
  const { config: whiteLabel, enable: enabledWhiteLabel } = formData.whiteLabel;
  const chainConfig = chainConfigs[formData.chainNamespace as ChainNamespaceType].find((x) => x.chainId === formData.chain)!;

  // Account Abstraction
  const { useAccountAbstractionProvider } = formData;
  let accountAbstractionConfig = undefined;
  if (showAAProviderSettings.value && useAccountAbstractionProvider) {
    let smartAccountType = ""
    let smartAccountConfig = undefined;
    switch (formData.smartAccountType) {
      case "nexus":
        smartAccountType = SMART_ACCOUNT.NEXUS;
        break;
      case "kernel":
        smartAccountType = SMART_ACCOUNT.KERNEL;
        break;
      case "trust":
        smartAccountType = SMART_ACCOUNT.TRUST;
        break;
      // case "light":
      //   smartAccountInit = new LightSmartAccount();
      //   break;
      // case "simple":
      //   smartAccountInit = new SimpleSmartAccount();
      //   break;
      case "safe":
      default:
        smartAccountType = SMART_ACCOUNT.SAFE;
        break;
    }
    accountAbstractionConfig = {
      smartAccountType,
      paymasterConfig: formData.paymasterUrl ? { url: formData.paymasterUrl } : undefined,
      bundlerConfig: { url: formData.bundlerUrl ?? getDefaultBundlerUrl(chainConfig.chainId) },
      smartAccountConfig,
    }
  }

  // Wallet services settings
  let walletServicesSettings: Web3AuthOptions["walletServicesSettings"];
  const uiConfig = enabledWhiteLabel ? { ...whiteLabel } : undefined;
  if (formData.walletPlugin.enable) {
    const { confirmationStrategy } = formData.walletPlugin;
    walletServicesSettings = {
      whiteLabel: {
        ...uiConfig,
        showWidgetButton: true,
      },
      confirmationStrategy,
      accountAbstractionConfig,
    };
  }


  return {
    clientId: clientIds[formData.network],
    web3AuthNetwork: formData.network,
    uiConfig,
    accountAbstractionProvider: accountAbstractionProvider.value,
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
    multiInjectedProviderDiscovery: formData.multiInjectedProviderDiscovery,
    walletServicesSettings,
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
  const plugins = [];
  if (formData.chainNamespace === CHAIN_NAMESPACES.EIP155 || formData.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    if (formData.nftCheckoutPlugin.enable && formData.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      const nftCheckoutPlugin = new NFTCheckoutPlugin({
        clientId: NFT_CHECKOUT_CLIENT_ID,
      });
      plugins.push(nftCheckoutPlugin);
    }
    if (formData.walletPlugin.enable) {
      const walletServicesPlugin = new WalletServicesPlugin();
      plugins.push(walletServicesPlugin);
    }
  }

  return {
    web3AuthOptions: options.value,
    plugins,
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
