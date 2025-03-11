<script setup lang="ts">
import {
  CHAIN_NAMESPACES,
  WalletConnectV2Adapter,
  getChainConfig,
  WalletServicesPlugin,
  type Web3AuthOptions,
  EthereumPrivateKeyProvider,
  NFTCheckoutPlugin,
  SolanaPrivateKeyProvider,
  CommonPrivateKeyProvider,
  CoinbaseAdapter,
  ChainNamespaceType,
  IAdapter,
  IBaseProvider,
  IProvider,
  storageAvailable,
  WALLET_ADAPTERS,
  AccountAbstractionProvider,
  ISmartAccount,
  KernelSmartAccount,
  NexusSmartAccount,
  SafeSmartAccount,
  TrustSmartAccount,
  getEvmInjectedAdapters,
  getSolanaInjectedAdapters,
} from "@web3auth/modal";
import { WalletServicesProvider } from "@web3auth/no-modal/vue";
import { Web3AuthProvider } from "@web3auth/modal/vue";
import { computed, onBeforeMount, ref, watch } from "vue";

import AppDashboard from "./components/AppDashboard.vue";
import AppHeader from "./components/AppHeader.vue";
import AppSettings from "./components/AppSettings.vue";
import { chainConfigs, clientIds, getDefaultBundlerUrl, NFT_CHECKOUT_CLIENT_ID } from "./config";
import { formDataStore } from "./store/form";
import { WidgetType } from "@web3auth/modal/dist/types/ui";

const formData = formDataStore;

const externalAdapters = ref<IAdapter<unknown>[]>([]);

const getChainById = (chainId: string) => {
  const chain = getChainConfig(formData.chainNamespace, chainId);
  if (!chain) {
    throw new Error(`Chain config not found for chainId: ${chainId}`);
  }
  if (formData.chainNamespace === CHAIN_NAMESPACES.SOLANA && chainId === "0x65") {
    chain.rpcTarget = import.meta.env.VITE_APP_SOLANA_MAINNET_RPC || chain.rpcTarget;
  }
  return chain;
};

// Populate the private key provider based on the chain selected
const privateKeyProvider = computed((): IBaseProvider<string> => {
  const chainConfig = getChainById(formData.chain)!;

  switch (formData.chainNamespace) {
    case CHAIN_NAMESPACES.EIP155:
      return new EthereumPrivateKeyProvider({
        config: {
          chainConfig,
        },
      });
    case CHAIN_NAMESPACES.SOLANA:
      return new SolanaPrivateKeyProvider({
        config: {
          chainConfig,
        },
      });
    default:
      return new CommonPrivateKeyProvider({
        config: {
          chainConfig,
        },
      });
  }
});

const showAAProviderSettings = computed(() => formData.chainNamespace === CHAIN_NAMESPACES.EIP155);

const accountAbstractionProvider = computed((): IBaseProvider<IProvider> | undefined => {
  const { useAccountAbstractionProvider } = formData;
  if (!showAAProviderSettings.value || !useAccountAbstractionProvider) return undefined;

  const chainConfig = getChainById(formData.chain)!;
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
  const { widget, targetId } = formData;
  return {
    clientId: clientIds[formData.network],
    privateKeyProvider: privateKeyProvider.value as IBaseProvider<string>,
    web3AuthNetwork: formData.network,
    uiConfig: enabledWhiteLabel ? { ...whiteLabel, widget: widget as WidgetType, targetId } : { widget: widget as WidgetType, targetId },
    accountAbstractionProvider: accountAbstractionProvider.value,
    useAAWithExternalWallet: formData.useAAWithExternalWallet,
    // TODO: Add more options
    // chainConfig?: CustomChainConfig;
    // enableLogging?: boolean;
    // storageKey?: "session" | "local";
    // sessionTime?: number;
    // useCoreKitKey?: boolean;
    enableLogging: true,
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
    [WALLET_ADAPTERS.AUTH]: {
      label: "auth",
      loginMethods: loginMethodsConfig.value,
    },
  };
  return modalConfig;
});

const getExternalAdapterByName = (name: string): IAdapter<unknown>[] => {
  switch (name) {
    case "coinbase":
      return [new CoinbaseAdapter()];
    case "wallet-connect-v2":
      return [new WalletConnectV2Adapter({ adapterSettings: { walletConnectInitOptions: { projectId: "d3c63f19f9582f8ba48e982057eb096b" } } })];
    case "injected-evm":
      return getEvmInjectedAdapters({ options: options.value });
    case "injected-solana":
      return getSolanaInjectedAdapters({ options: options.value });
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
        formData.adapters = json.adapters;
        formData.chain = json.chain;
        formData.chainNamespace = json.chainNamespace;
        formData.loginProviders = json.loginProviders;
        formData.showWalletDiscovery = json.showWalletDiscovery;
        formData.network = json.network;
        formData.whiteLabel = json.whiteLabel;
        formData.walletPlugin = json.walletPlugin;
        formData.nftCheckoutPlugin = json.nftCheckoutPlugin || {};
        formData.useAccountAbstractionProvider = json.useAccountAbstractionProvider;
        formData.smartAccountType = json.smartAccountType;
        formData.bundlerUrl = json.bundlerUrl;
        formData.paymasterUrl = json.paymasterUrl;
        formData.widget = json.widget;
        formData.targetId = json.targetId;
      }
    } catch (error) {}
  }
  if (!chainConfigs[formData.chainNamespace].find((chainId) => chainId === formData.chain)) formData.chain = chainConfigs[formData.chainNamespace][0];
});

watch(formData, () => {
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(formData));
});

// Every time the form data changes, reinitialize the web3Auth object
watch(
  () => formData.adapters,
  async () => {
    let adapters: IAdapter<unknown>[] = [];
    for (let i = 0; i <= formData.adapters.length; i += 1) {
      adapters = adapters.concat(getExternalAdapterByName(formData.adapters[i]));
    }
    externalAdapters.value = adapters;
  }
);

const configs = computed(() => {
  const plugins = [];
  if (formData.chainNamespace === CHAIN_NAMESPACES.EIP155 || formData.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    if (formData.nftCheckoutPlugin.enable && formData.chainNamespace === CHAIN_NAMESPACES.EIP155) {
      const nftCheckoutPlugin = new NFTCheckoutPlugin({
        clientId: NFT_CHECKOUT_CLIENT_ID,
      });
      plugins.push(nftCheckoutPlugin);
    }
    if (formData.walletPlugin.enable) {
      const { uiConfig } = options.value;
      const { logoDark, logoLight, confirmationStrategy } = formData.walletPlugin;
      const walletServicesPlugin = new WalletServicesPlugin({
        walletInitOptions: {
          whiteLabel: {
            ...uiConfig,
            showWidgetButton: true,
            logoDark: logoDark || "https://images.web3auth.io/web3auth-logo-w-light.svg",
            logoLight: logoLight || "https://images.web3auth.io/web3auth-logo-w.svg",
          },
          confirmationStrategy,
        },
      });
      plugins.push(walletServicesPlugin);
    }
  }

  return {
    adapters: externalAdapters.value,
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
      <div class="flex flex-col items-center justify-center">
        <main class="relative flex flex-col lg:h-[calc(100dvh_-_110px)]">
          <AppSettings />
          <AppDashboard />
        </main>
      </div>
    </WalletServicesProvider>
  </Web3AuthProvider>
</template>
