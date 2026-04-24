<script setup lang="ts">
import {
  authConnector,
  CHAIN_NAMESPACES,
  type ConnectorFn,
  type CustomChainConfig,
  type PluginFn,
  storageAvailable,
  WALLET_CONNECTORS,
  walletServicesPlugin,
  type AccountAbstractionMultiChainConfig,
  type Web3AuthOptions,
  type ConnectorsModalConfig,
  type LoginMethodConfig,
} from "@web3auth/modal";

import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/vue";
import { SolanaProvider } from "@web3auth/modal/vue/solana";
import { WagmiProvider } from "@web3auth/modal/vue/wagmi";
import { coinbaseConnector } from "@web3auth/no-modal/connectors/coinbase-connector";
import { computed, onBeforeMount, ref, watch } from "vue";

import {
  CookieStorage,
  LocalStorageAdapter,
  MemoryStorage,
  SessionStorageAdapter,
  WEB3AUTH_NETWORK,
  type StorageConfig,
} from "@web3auth/auth";
import AppDashboard from "./components/AppDashboard.vue";
import AppHeader from "./components/AppHeader.vue";
import AppSettings from "./components/AppSettings.vue";
import { clientIds, resolveBuildEnv } from "./config";
import { formDataStore } from "./store/form";
import { getChainConfig } from "./utils/chainconfig";
import { SmartAccountType } from "@toruslabs/ethereum-controllers";
import { WS_EMBED_LOGIN_MODE } from "@web3auth/ws-embed";

const formData = formDataStore;

const externalConnectors = ref<ConnectorFn[]>([]);

function buildStorageConfig(): StorageConfig | undefined {
  const type = formData.tokenStorage;
  if (type === "default") return undefined;

  const adapter =
    type === "session"
      ? new SessionStorageAdapter()
      : type === "cookies"
        ? new CookieStorage({ maxAge: 7 * 86400 })
        : type === "memory"
          ? new MemoryStorage()
          : new LocalStorageAdapter();

  return { sessionId: adapter, accessToken: adapter, refreshToken: adapter, idToken: adapter };
}

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
    loginMode: WS_EMBED_LOGIN_MODE.PLUGIN,
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
      loginMode: WS_EMBED_LOGIN_MODE.PLUGIN,
    };
  }

  // Plugins
  const plugins: PluginFn[] = [];
  if (formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155) || formData.chainNamespaces.includes(CHAIN_NAMESPACES.SOLANA)) {
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

  const { widget, targetId, externalWalletOnly } = formData;
  const { hideSuccessScreen } = formData.whiteLabel;
  const uiConfig: Web3AuthOptions["uiConfig"] = enabledWhiteLabel
    ? { ...whiteLabel, widgetType: widget, targetId, hideSuccessScreen, ...(externalWalletOnly && { primaryButton: "externalLogin" }) }
    : { widgetType: widget, targetId, hideSuccessScreen, ...(externalWalletOnly && { primaryButton: "externalLogin" }) };
  const authConnectorInstance = authConnector({ connectorSettings: {} });

  return {
    clientId: clientIds[formData.network],
    web3AuthNetwork: formData.network,
    uiConfig,
    accountAbstractionConfig,
    useAAWithExternalWallet: formData.useAAWithExternalWallet,
    storage: buildStorageConfig(),
    chains,
    defaultChainId: formData.defaultChainId,
    enableLogging: true,
    authBuildEnv: formData.authBuildEnv,
    connectors: [...externalConnectors.value, authConnectorInstance],
    plugins,
    multiInjectedProviderDiscovery: formData.multiInjectedProviderDiscovery,
    walletServicesConfig,
    modalConfig: {
      connectors: modalParams.value,
      hideWalletDiscovery: !formData.showWalletDiscovery,
    },
    initialAuthenticationMode: formData.initialAuthenticationMode,
  };
});

// Note: authConnectionId may varies based on the project config and web3auth client id.
// The following function return the authConnectionId relevant to the AuthBuildEnv and `clientIds` Map from `config.ts`
// we may need to change the values every time we change the web3auth client id or build environment.
const getAuthConnectionIds = (authConnectionStr: string): { authConnectionId: string; groupedAuthConnectionId?: string } => {
  if (formData.network === WEB3AUTH_NETWORK.SAPPHIRE_MAINNET) {
    return {
      authConnectionId: "web3auth",
      groupedAuthConnectionId: `web3auth-auth0-${authConnectionStr}-passwordless-sapphire`,
    };
  }
  return {
    authConnectionId: `w3a-custom-${authConnectionStr}-${formData.network.replace("_", "-")}`,
  };
};

const loginMethodsConfig = computed(() => {
  const { authConnectionId: customEmailAuthConnectionId, groupedAuthConnectionId: customEmailGroupedAuthConnectionId } =
    getAuthConnectionIds("email");
  const { authConnectionId: customSmsAuthConnectionId, groupedAuthConnectionId: customSmsGroupedAuthConnectionId } = getAuthConnectionIds("sms");
  const customConfig = {
    email_passwordless: {
      authConnectionId: customEmailAuthConnectionId,
      groupedAuthConnectionId: customEmailGroupedAuthConnectionId,
    },
    sms_passwordless: {
      authConnectionId: customSmsAuthConnectionId,
      groupedAuthConnectionId: customSmsGroupedAuthConnectionId,
    },
  };
  if (formData.loginProviders.length === 0) return customConfig;

  // only show login methods that are configured
  const config = formData.loginProviders.reduce((acc, provider) => {
    acc[provider] = formData.loginMethods[provider];
    return acc;
  }, {} as LoginMethodConfig);

  if (config.email_passwordless) {
    config.email_passwordless.authConnectionId = customEmailAuthConnectionId;
    config.email_passwordless.groupedAuthConnectionId = customEmailGroupedAuthConnectionId;
  }
  if (config.sms_passwordless) {
    config.sms_passwordless.authConnectionId = customSmsAuthConnectionId;
    config.sms_passwordless.groupedAuthConnectionId = customSmsGroupedAuthConnectionId;
  }

  const loginMethods: LoginMethodConfig = JSON.parse(JSON.stringify(config));
  return loginMethods;
});

const modalParams = computed(() => {
  const modalConfig = {
    [WALLET_CONNECTORS.AUTH]: {
      label: "auth",
      loginMethods: loginMethodsConfig.value,
      showOnModal: !formData.externalWalletOnly,
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
        formData.authBuildEnv = resolveBuildEnv(json.authBuildEnv);
        formData.whiteLabel = json.whiteLabel;
        formData.walletPlugin = json.walletPlugin;
        formData.useAccountAbstractionProvider = json.useAccountAbstractionProvider;
        formData.smartAccountType = json.smartAccountType;
        formData.smartAccountChains = json.smartAccountChains || [];
        formData.smartAccountChainsConfig = json.smartAccountChainsConfig || {};
        formData.defaultChainId = json.defaultChainId;
        formData.initialAuthenticationMode = json.initialAuthenticationMode;
        formData.externalWalletOnly = json.externalWalletOnly || false;
        formData.tokenStorage = json.tokenStorage || "default";
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
      <SolanaProvider>
        <AppHeader />
        <div class="flex flex-col items-center justify-center">
          <main class="relative flex flex-col lg:h-[calc(100dvh_-_110px)]">
            <AppSettings />
            <AppDashboard />
          </main>
        </div>
      </SolanaProvider>
    </WagmiProvider>
  </Web3AuthProvider>
</template>
