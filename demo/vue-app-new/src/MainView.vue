<script setup lang="ts">
import { Button, Card, Select, Tab, Tabs, Tag, TextField, Toggle } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, ChainNamespaceType, IBaseProvider, IProvider, storageAvailable, WALLET_ADAPTERS, WEB3AUTH_NETWORK } from "@web3auth/base";
import { CoinbaseAdapter } from "@web3auth/coinbase-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { MetamaskAdapter } from "@web3auth/metamask-adapter";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { useWeb3Auth } from "@web3auth/modal-vue-composables";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { PhantomAdapter } from "@web3auth/phantom-adapter";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { SolanaWalletConnectorPlugin } from "@web3auth/solana-wallet-connector-plugin";
import { TorusWalletAdapter } from "@web3auth/torus-evm-adapter";
import { SolanaWalletAdapter } from "@web3auth/torus-solana-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { computed, InputHTMLAttributes, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import {
  chainConfigs,
  chainNamespaceOptions,
  clientIds,
  defaultLoginMethod,
  FormData,
  initWhiteLabel,
  languageOptions,
  loginProviderOptions,
  networkOptions,
} from "./config";
import { getAccounts, getBalance, getChainId, sendEth, signEthMessage, signTransaction } from "./services/ethHandlers";
import { signAllTransactions, signAndSendTransaction, signMessage } from "./services/solHandlers";

const { t } = useI18n({ useScope: "global" });
const { log } = console;
const { web3Auth, isConnected, connect, isInitialized, initModal, logout, status, provider, userInfo, switchChain, addAndSwitchChain, addPlugin } =
  useWeb3Auth();

const formData = ref<FormData>({
  // authMode: "",
  network: WEB3AUTH_NETWORK.TESTNET,
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chain: CHAIN_NAMESPACES.EIP155,
  whiteLabel: {
    enable: false,
    config: initWhiteLabel,
  },
  loginProviders: [],
  adapters: [],
  enableWalletServicePlugin: false,
  loginMethods: defaultLoginMethod,
});

const walletServicesPlugin = new WalletServicesPlugin({
  walletInitOptions: { whiteLabel: { showWidgetButton: true, logoDark: "logo", logoLight: "logo" } },
});

const solanaWalletConnectorPlugin = new SolanaWalletConnectorPlugin({});

const walletPlugin = computed(() => {
  if (formData.value.chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return walletServicesPlugin;
  }
  return solanaWalletConnectorPlugin;
});

const chainOptions = computed(() =>
  chainConfigs[formData.value.chainNamespace as ChainNamespaceType].map((x) => ({
    name: `${x.chainId} ${x.tickerName}`,
    value: x.chainId,
  }))
);

const adapterOptions = computed(() =>
  formData.value.chainNamespace === CHAIN_NAMESPACES.EIP155
    ? [
        { name: "coinbase-adapter", value: "coinbase" },
        { name: "metamask-adapter", value: "metamask" },
        { name: "openlogin-adapter", value: "openlogin" },
        { name: "torus-evm-adapter", value: "torus-evm" },
        { name: "wallet-connect-v2-adapter", value: "wallet-connect-v2" },
      ]
    : [
        { name: "phantom-adapter", value: "phantom" },
        { name: "torus-solana-adapter", value: "torus-solana" },
      ]
);

// Populate the private key provider based on the chain selected
const privateKeyProvider = computed((): IBaseProvider<string> | null => {
  const chainConfig = chainConfigs[formData.value.chainNamespace as ChainNamespaceType].find((x) => x.chainId === formData.value.chain);
  if (!chainConfig) return null;

  switch (formData.value.chainNamespace) {
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
      return null;
  }
});

// Options for reinitializing the web3Auth object
const options = computed((): Web3AuthOptions => {
  const {
    whiteLabel: { config: whiteLabel, enable: enabledWhiteLabel },
  } = formData.value;
  return {
    clientId: clientIds[formData.value.network],
    privateKeyProvider: privateKeyProvider.value as IBaseProvider<string>,
    web3AuthNetwork: formData.value.network,
    uiConfig: enabledWhiteLabel ? { ...whiteLabel } : undefined,
    // TODO: Add more options
    // chainConfig?: CustomChainConfig;
    // enableLogging?: boolean;
    // storageKey?: "session" | "local";
    // sessionTime?: number;
    // useCoreKitKey?: boolean;
    // enableLogging: true,
  };
});

const modalParams = computed(() => {
  const modalConfig = {
    [WALLET_ADAPTERS.OPENLOGIN]: {
      label: "openlogin",
      loginMethods: JSON.parse(JSON.stringify(formData.value.loginMethods)),
    },
  };
  return { modalConfig };
});

const getExternalAdapterByName = (name: string) => {
  switch (name) {
    case "coinbase":
      return new CoinbaseAdapter();
    case "metamask":
      return new MetamaskAdapter();
    case "openlogin":
      return new OpenloginAdapter();
    case "phantom":
      return new PhantomAdapter();
    case "torus-evm":
      return new TorusWalletAdapter();
    case "torus-solana":
      return new SolanaWalletAdapter();
    default:
      return null;
  }
};

const initW3A = async () => {
  if (!chainOptions.value.find((option) => option.value === formData.value.chain)) formData.value.chain = chainOptions.value[0]?.value;
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(formData.value));
  web3Auth.value?.clearCache();
  web3Auth.value = new Web3Auth(options.value);
  for (let i = 0; i <= formData.value.adapters.length; i += 1) {
    const externalAdapter = getExternalAdapterByName(formData.value.adapters[i]);
    if (externalAdapter) web3Auth.value.configureAdapter(externalAdapter);
  }
  if (formData.value.enableWalletServicePlugin) await addPlugin(walletPlugin.value);

  await initModal(modalParams.value);
};

// Init the web3Auth object
const init = async () => {
  initW3A();
};
init();

// Every time the form data changes, reinitialize the web3Auth object
watch(formData.value, async () => {
  initW3A();
});

watch(status, () => {
  log("status :::::::::::::::::::::::::::", status.value);
});

// const enableMFA = async () => {
//   await w3EnableMFA();
// };
const printToConsole = (...args: unknown[]) => {
  const el = document.querySelector("#console>pre");
  const h1 = document.querySelector("#console>h1");
  const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
  if (h1) {
    h1.innerHTML = args[0] as string;
  }
  if (el) {
    el.innerHTML = JSON.stringify(args[1] || {}, null, 2);
  }
  if (consoleBtn) {
    consoleBtn.style.display = "block";
  }
};

const onGetUserInfo = async () => {
  printToConsole("User Info", userInfo);
};

const clearConsole = () => {
  const el = document.querySelector("#console>pre");
  const h1 = document.querySelector("#console>h1");
  const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
  if (h1) {
    h1.innerHTML = "";
  }
  if (el) {
    el.innerHTML = "";
  }
  if (consoleBtn) {
    consoleBtn.style.display = "none";
  }
};

const onSendEth = async () => {
  await sendEth(provider.value as IProvider, printToConsole);
};

const onSignEthMessage = async () => {
  await signEthMessage(provider.value as IProvider, printToConsole);
};

const onGetAccounts = async () => {
  await getAccounts(provider.value as IProvider, printToConsole);
};

const getConnectedChainId = async () => {
  await getChainId(provider.value as IProvider, printToConsole);
};

const onGetBalance = async () => {
  await getBalance(provider.value as IProvider, printToConsole);
};

const onSwitchChain = async () => {
  log("switching chain");
  try {
    await switchChain({ chainId: "0x89" });
    printToConsole("switchedChain");
  } catch (error) {
    printToConsole("switchedChain error", error);
  }
};

const onAddChain = async () => {
  try {
    await addAndSwitchChain({
      chainId: "0x89",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      rpcTarget: "https://rpc-sepolia.tor.us",
      blockExplorerUrl: "https://sepolia.etherscan.io",
      displayName: "Sepolia",
      ticker: "ETH",
      tickerName: "Ethereum",
    });
    printToConsole("added chain");
  } catch (error) {
    printToConsole("add chain error", error);
  }
};

const onSignAndSendTransaction = async () => {
  await signAndSendTransaction(provider.value as IProvider, printToConsole);
};

const onSignTransaction = async () => {
  await signTransaction(provider.value as IProvider, printToConsole);
};

const onSignMessage = async () => {
  await signMessage(provider.value as IProvider, printToConsole);
};

const onSignAllTransactions = async () => {
  await signAllTransactions(provider.value as IProvider, printToConsole);
};
const isDisplay = (name: string): boolean => {
  switch (name) {
    case "btnLogout":
      return isConnected.value;

    case "form":
      return !isConnected.value;

    case "appHeading":
      return isConnected.value;

    case "ethServices":
      return formData.value.chainNamespace === CHAIN_NAMESPACES.EIP155;

    case "solServices":
      return formData.value.chainNamespace === CHAIN_NAMESPACES.SOLANA;

    case "walletServices":
      return formData.value.enableWalletServicePlugin;

    default: {
      return false;
    }
  }
};
const isDisabled = (name: string): boolean => {
  switch (name) {
    case "whiteLabelSettings":
      return !formData.value.whiteLabel.enable;

    case "walletServicePlugin":
      return formData.value.chainNamespace !== CHAIN_NAMESPACES.EIP155;

    case "solanaWalletServicePlugin":
      return formData.value.chainNamespace !== CHAIN_NAMESPACES.SOLANA;

    case "btnConnect":
      return !isInitialized.value;

    default: {
      return false;
    }
  }
};
const onLogout = async () => {
  await logout();
};

const activeTab = ref(0);
const onTabChange = (index: number) => {
  activeTab.value = index;
};
const isActiveTab = (index: number) => activeTab.value === index;

const showWalletUI = async () => {
  await walletPlugin.value.showWalletUi();
};
const showCheckout = async () => {
  await walletPlugin.value.showCheckout();
};
const showWalletConnectScanner = async () => {
  await walletPlugin.value.showWalletConnectScanner();
};
</script>

<template>
  <nav class="bg-white sticky top-0 z-50 w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="isDisplay('btnLogout')" block size="xs" pill variant="secondary" @click="onLogout">
          {{ $t("app.btnLogout") }}
        </Button>
        <Button v-else block size="xs" pill variant="secondary" @click="() => {}">
          {{ $t("app.documentation") }}
        </Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1">
        <div v-if="isDisplay('appHeading')" class="max-sm:w-full">
          <h1 class="leading-tight text-3xl font-extrabold">{{ $t("app.title") }}</h1>
          <p class="leading-tight text-1xl">{{ $t("app.description") }}</p>
        </div>
      </div>
    </div>
  </nav>
  <main class="flex-1 p-1">
    <div class="relative">
      <div v-if="isDisplay('form')" class="grid grid-cols-8 gap-0">
        <div class="col-span-0 sm:col-span-1 lg:col-span-2"></div>
        <Card class="h-auto px-8 py-8 col-span-8 sm:col-span-6 lg:col-span-4">
          <div class="text-3xl font-bold leading-tight text-center">{{ $t("app.greeting") }}</div>
          <div class="leading-tight font-extrabold text-center mb-12">
            <Tag v-bind="{ minWidth: 'inherit' }">{{ status.toUpperCase() }}</Tag>
            &nbsp;
            <Tag v-bind="{ minWidth: 'inherit' }">{{ isInitialized ? "INITIALIZED" : "NOT_INITIALIZE_YET" }}</Tag>
          </div>
          <Tabs>
            <Tab variant="button" :active="isActiveTab(0)" @click="onTabChange(0)">General</Tab>
            <Tab variant="button" :active="isActiveTab(1)" @click="onTabChange(1)">WhiteLabel</Tab>
            <Tab variant="button" :active="isActiveTab(2)" @click="onTabChange(2)">Login Provider</Tab>
            <Tab variant="button" :active="isActiveTab(3)" @click="onTabChange(3)">Adapters</Tab>
          </Tabs>
          <Card v-if="isActiveTab(0)" class="grid grid-cols-1 gap-2 py-4 px-4" :shadow="false">
            <Select
              v-model="formData.network"
              data-testid="selectNetwork"
              :label="$t('app.network')"
              :aria-label="$t('app.network')"
              :placeholder="$t('app.network')"
              :options="networkOptions"
            />
            <Select
              v-model="formData.chainNamespace"
              data-testid="selectChainNamespace"
              :label="$t('app.chainNamespace')"
              :aria-label="$t('app.chainNamespace')"
              :placeholder="$t('app.chainNamespace')"
              :options="chainNamespaceOptions"
            />
            <Select
              v-model="formData.chain"
              data-testid="selectChain"
              :label="$t('app.chain')"
              :aria-label="$t('app.chain')"
              :placeholder="$t('app.chain')"
              :options="chainOptions"
            />
            <Toggle
              v-model="formData.enableWalletServicePlugin"
              :show-label="true"
              :size="'small'"
              :label-disabled="$t('app.enableWalletServicePlugin')"
              :label-enabled="$t('app.enableWalletServicePlugin')"
              class="mb-2"
            />
          </Card>
          <Card v-if="isActiveTab(1)" class="grid grid-cols-1 sm:grid-cols-2 gap-2 py-4 px-4" :shadow="false">
            <Toggle
              v-model="formData.whiteLabel.enable"
              data-testid="whitelabel"
              :show-label="true"
              :size="'small'"
              :label-disabled="$t('app.whiteLabel.title')"
              :label-enabled="$t('app.whiteLabel.title')"
              class="mb-2"
            />
            <Toggle
              id="useLogoLoader"
              v-model="formData.whiteLabel.config.useLogoLoader"
              :show-label="true"
              :size="'small'"
              :label-disabled="$t('app.whiteLabel.useLogoLoader')"
              :label-enabled="$t('app.whiteLabel.useLogoLoader')"
              :disabled="isDisabled('whiteLabelSettings')"
            />
            <TextField
              v-model="formData.whiteLabel.config.appName"
              :label="$t('app.whiteLabel.appName')"
              :aria-label="$t('app.whiteLabel.appName')"
              :placeholder="$t('app.whiteLabel.appName')"
              :disabled="isDisabled('whiteLabelSettings')"
            />
            <Select
              v-model="formData.whiteLabel.config.defaultLanguage"
              :label="$t('app.whiteLabel.defaultLanguage')"
              :aria-label="$t('app.whiteLabel.defaultLanguage')"
              :placeholder="$t('app.whiteLabel.defaultLanguage')"
              :options="languageOptions"
              :disabled="isDisabled('whiteLabelSettings')"
            />
            <TextField
              v-model="formData.whiteLabel.config.appUrl"
              :label="$t('app.whiteLabel.appUrl')"
              :aria-label="$t('app.whiteLabel.appUrl')"
              :placeholder="$t('app.whiteLabel.appUrl')"
              :disabled="isDisabled('whiteLabelSettings')"
              class="col-span-2"
            />
            <TextField
              v-model="formData.whiteLabel.config.logoLight"
              :label="$t('app.whiteLabel.logoLight')"
              :aria-label="$t('app.whiteLabel.logoLight')"
              :placeholder="$t('app.whiteLabel.logoLight')"
              :disabled="isDisabled('whiteLabelSettings')"
            />
            <TextField
              v-model="formData.whiteLabel.config.logoDark"
              :label="$t('app.whiteLabel.logoDark')"
              :aria-label="$t('app.whiteLabel.logoDark')"
              :placeholder="$t('app.whiteLabel.logoDark')"
              :disabled="isDisabled('whiteLabelSettings')"
            />

            <TextField
              :model-value="formData.whiteLabel.config.theme?.primary"
              :label="$t('app.whiteLabel.primaryColor')"
              :aria-label="$t('app.whiteLabel.primaryColor')"
              :placeholder="$t('app.whiteLabel.primaryColor')"
              :disabled="isDisabled('whiteLabelSettings')"
            >
              <template #endIconSlot>
                <input
                  id="primary-color-picker"
                  class="color-picker"
                  type="color"
                  :value="formData.whiteLabel.config.theme?.primary"
                  @input="
                    (e) => {
                      const color = (e.target as InputHTMLAttributes).value;
                      formData.whiteLabel.config.theme = { ...formData.whiteLabel.config.theme, primary: color };
                    }
                  "
                />
              </template>
            </TextField>
            <TextField
              :model-value="formData.whiteLabel.config.theme?.onPrimary"
              :label="$t('app.whiteLabel.onPrimaryColor')"
              :aria-label="$t('app.whiteLabel.onPrimaryColor')"
              :placeholder="$t('app.whiteLabel.onPrimaryColor')"
              :disabled="isDisabled('whiteLabelSettings')"
            >
              <template #endIconSlot>
                <input
                  id="primary-color-picker"
                  class="color-picker"
                  type="color"
                  :value="formData.whiteLabel.config.theme?.onPrimary"
                  @input="
                    (e) => {
                      const color = (e.target as InputHTMLAttributes).value;
                      formData.whiteLabel.config.theme = { ...formData.whiteLabel.config.theme, onPrimary: color };
                    }
                  "
                />
              </template>
            </TextField>
          </Card>
          <Card v-if="isActiveTab(2)" class="grid grid-cols-1 gap-2 py-4 px-4" :shadow="false">
            <Select
              v-model="formData.loginProviders"
              data-testid="selectLoginProviders"
              :label="$t('app.loginProviders')"
              :aria-label="$t('app.loginProviders')"
              :placeholder="$t('app.loginProviders')"
              :options="loginProviderOptions"
              multiple
              class=""
            />
            <Card v-for="p in formData.loginProviders" :key="p" :shadow="false" class="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="font-bold leading-tight text-left sm:col-span-2">{{ p }}</div>
              <Toggle
                v-model="formData.loginMethods[p].mainOption"
                :show-label="true"
                :size="'small'"
                :label-disabled="$t('app.loginMethod.mainOption')"
                :label-enabled="$t('app.loginMethod.mainOption')"
              />
              <TextField
                v-model="formData.loginMethods[p].name"
                :label="$t('app.loginMethod.name')"
                :aria-label="$t('app.loginMethod.name')"
                :placeholder="$t('app.loginMethod.name')"
              />
              <TextField
                v-model="formData.loginMethods[p].description"
                :label="$t('app.loginMethod.description')"
                :aria-label="$t('app.loginMethod.description')"
                :placeholder="$t('app.loginMethod.description')"
                class="sm:col-span-2"
              />
              <TextField
                v-model="formData.loginMethods[p].logoHover"
                :label="$t('app.loginMethod.logoHover')"
                :aria-label="$t('app.loginMethod.logoHover')"
                :placeholder="$t('app.loginMethod.logoHover')"
              />
              <TextField
                v-model="formData.loginMethods[p].logoLight"
                :label="$t('app.loginMethod.logoLight')"
                :aria-label="$t('app.loginMethod.logoLight')"
                :placeholder="$t('app.loginMethod.logoLight')"
              />
              <TextField
                v-model="formData.loginMethods[p].logoDark"
                :label="$t('app.loginMethod.logoDark')"
                :aria-label="$t('app.loginMethod.logoDark')"
                :placeholder="$t('app.loginMethod.logoDark')"
              />
              <Toggle
                v-model="formData.loginMethods[p].showOnModal"
                :show-label="true"
                :size="'small'"
                :label-disabled="$t('app.loginMethod.showOnModal')"
                :label-enabled="$t('app.loginMethod.showOnModal')"
              />
              <Toggle
                v-model="formData.loginMethods[p].showOnDesktop"
                :show-label="true"
                :size="'small'"
                :label-disabled="$t('app.loginMethod.showOnDesktop')"
                :label-enabled="$t('app.loginMethod.showOnDesktop')"
              />
              <Toggle
                v-model="formData.loginMethods[p].showOnMobile"
                :show-label="true"
                :size="'small'"
                :label-disabled="$t('app.loginMethod.showOnMobile')"
                :label-enabled="$t('app.loginMethod.showOnMobile')"
              />
            </Card>
          </Card>
          <Card v-if="isActiveTab(3)" class="grid grid-cols-1 gap-2 py-4 px-4" :shadow="false">
            <Select
              v-model="formData.adapters"
              data-testid="selectAdapters"
              :label="$t('app.adapters')"
              :aria-label="$t('app.adapters')"
              :placeholder="$t('app.adapters')"
              :options="adapterOptions"
              multiple
              :show-check-box="true"
            />
            <Card v-for="a in formData.adapters" :key="a" :shadow="false" class="px-4 py-4 grid grid-cols-1 sm:grid-cols-2">
              <div class="font-bold leading-tight text-left sm:col-span-2">{{ a }}</div>
              <template v-if="['coinbase', 'metamask', 'slope', 'solfare'].includes(a)">
                <TextField
                  type="number"
                  :label="$t('app.adapter.sessionTime')"
                  :aria-label="$t('app.adapter.sessionTime')"
                  :placeholder="$t('app.adapter.sessionTime')"
                  class="sm:col-span-2"
                />
              </template>
            </Card>
          </Card>
          <div class="flex justify-center mt-5">
            <Button
              :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
              data-testid="loginButton"
              type="button"
              block
              size="md"
              pill
              :disabled="isDisabled('btnConnect')"
              @click="connect"
            >
              Connect
            </Button>
          </div>
          <div class="text-base text-app-gray-900 dark:text-app-gray-200 font-medium mt-4 mb-5 px-0">
            Reach out to us at
            <a class="text-app-primary-600 dark:text-app-primary-500 underline" href="mailto:hello@tor.us">hello@tor.us</a>
            or
            <a class="text-app-primary-600 dark:text-app-primary-500 underline" href="https://t.me/torusdev">telegram group</a>
            .
          </div>
        </Card>
      </div>
      <div v-else class="grid gap-0">
        <div class="grid grid-cols-8 gap-0">
          <div class="col-span-1"></div>
          <Card class="px-4 py-4 gird col-span-2">
            <div class="mb-2">
              <Button block size="xs" pill variant="secondary" data-testid="btnClearConsole" @click="clearConsole">
                {{ $t("app.buttons.btnClearConsole") }}
              </Button>
            </div>
            <div class="mb-2">
              <Button block size="xs" pill @click="onGetUserInfo">
                {{ $t("app.buttons.btnGetUserInfo") }}
              </Button>
            </div>
            <Card v-if="isDisplay('walletServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
              <div class="text-xl font-bold leading-tight text-left mb-2">Wallet Service</div>
              <Button block size="xs" pill class="mb-2" @click="showWalletUI">
                {{ $t("app.buttons.btnShowWalletUI") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="showWalletConnectScanner">
                {{ $t("app.buttons.btnShowWalletConnectScanner") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="showCheckout">
                {{ $t("app.buttons.btnShowCheckout") }}
              </Button>
            </Card>
            <Card v-if="isDisplay('ethServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
              <div class="text-xl font-bold leading-tight text-left mb-2">Sample Transaction</div>
              <Button block size="xs" pill class="mb-2" @click="onGetAccounts">
                {{ t("app.buttons.btnGetAccounts") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onGetBalance">
                {{ t("app.buttons.btnGetBalance") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onSendEth">{{ t("app.buttons.btnSendEth") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSignEthMessage">{{ t("app.buttons.btnSignEthMessage") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="getConnectedChainId">
                {{ t("app.buttons.btnGetConnectedChainId") }}
              </Button>
            </Card>
            <Card v-if="isDisplay('solServices')" class="px-4 py-4 gap-4 h-auto mb-2" :shadow="false">
              <div class="text-xl font-bold leading-tight text-left mb-2">Sample Transaction</div>
              <Button block size="xs" pill class="mb-2" @click="onAddChain">{{ t("app.buttons.btnAddChain") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSignAndSendTransaction">
                {{ t("app.buttons.btnSignAndSendTransaction") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onSignTransaction">
                {{ t("app.buttons.btnSignTransaction") }}
              </Button>
              <Button block size="xs" pill class="mb-2" @click="onSignMessage">{{ t("app.buttons.btnSignMessage") }}</Button>
              <Button block size="xs" pill class="mb-2" @click="onSignAllTransactions">
                {{ t("app.buttons.btnSignAllTransactions") }}
              </Button>
            </Card>
          </Card>
          <Card id="console" class="px-4 py-4 col-span-4 overflow-y-auto">
            <pre
              class="whitespace-pre-line overflow-x-auto font-normal text-base leading-6 text-black break-words overflow-y-auto max-h-screen"
            ></pre>
          </Card>
        </div>
      </div>
    </div>
  </main>
</template>
