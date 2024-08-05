<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });
import { Button, Card, Select, Toggle, TextField, ExpansionPanel } from '@toruslabs/vue-components';
import {
  WhiteLabelData,
  LOGIN_PROVIDER_TYPE,
  storageAvailable,
} from "@toruslabs/openlogin-utils";
import { Web3AuthOptions, Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, ChainNamespaceType, IBaseProvider, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE, WALLET_ADAPTERS, IProvider } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { chainNamespaceOptions, chainOptions, clientIds, initWhiteLabel, networkOptions, loginProviderOptions, languageOptions } from './config';
import { useWeb3Auth } from '@web3auth/modal-vue-composables';
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CoinbaseAdapter } from "@web3auth/coinbase-adapter";
import { MetamaskAdapter } from "@web3auth/metamask-adapter";
import { PhantomAdapter } from "@web3auth/phantom-adapter";
import { TorusWalletAdapter } from "@web3auth/torus-evm-adapter";
import { SolanaWalletAdapter } from "@web3auth/torus-solana-adapter";

const { web3Auth, isConnected, connect, isInitialized, initModal, logout, status, provider, isMFAEnabled, userInfo, enableMFA: w3EnableMFA, switchChain, addAndSwitchChain, } = useWeb3Auth()
import { sendEth, signTransaction, signEthMessage, getAccounts, getChainId, getBalance } from './lib/eth';
import { signAndSendTransaction, signMessage, signAllTransactions } from './lib/sol';

const plugins = [
  { name: "wallet-services-plugin", value: "wallet-services-plugin" },
  { name: "solana-wallet-connector-plugin", value: "solana-wallet-connector-plugin" }
]

const adapters = [
  { name: "coinbase-adapter", value: "coinbase" },
  { name: "metamask-adapter", value: "metamask" },
  { name: "openlogin-adapter", value: "openlogin" },
  { name: "phantom-adapter", value: "phantom" },
  { name: "torus-evm-adapter", value: "torus-evm" },
  { name: "torus-solana-adapter", value: "torus-solana" },
  { name: "wallet-connect-v2-adapter", value: "wallet-connect-v2" },
]


type FormData = {
  // authMode: string;
  network: WEB3AUTH_NETWORK_TYPE;
  chainNamespace: ChainNamespaceType;
  chain: string;
  whiteLabel: {
    enable: boolean;
    config: WhiteLabelData;
  };
  loginProviders: LOGIN_PROVIDER_TYPE[];
  adapters: string[];
  plugins: string[];

};

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
  plugins: [],

});

const formConfig = {
  // ["authMode"]: {
  //   ["data-testid"]: "authMode",
  //   label: t('app.selectAuthMode'),
  //   ariaLabel: t('app.selectAuthMode'),
  //   placeholder: t('app.selectAuthMode'),
  //   options: [
  //     { name: "hosted", value: "hosted" },
  //     { name: "ownAuth", value: "ownAuth" }
  //   ],
  //   class: 'max-w-xs w-80'
  // },
  ["network"]: {
    label: t('app.selectNetwork'),
    ariaLabel: t('app.selectNetwork'),
    placeholder: t('app.selectNetwork'),
    options: networkOptions,
    class: 'max-w-xs w-80'
  },
  ["chainNamespace"]: {
    label: t('app.selectChainNamespace'),
    ariaLabel: t('app.selectChainNamespace'),
    placeholder: t('app.selectChainNamespace'),
    options: chainNamespaceOptions,
    class: 'max-w-xs w-80'
  },
  ["chain"]: {
    label: t('app.selectChain'),
    ariaLabel: t('app.selectChain'),
    placeholder: t('app.selectChain'),
    class: 'max-w-xs w-80'
  },
  ["whiteLabel"]: {
    enable: {
      showLabel: true,
      size: 'small' as "small" | "large" | "medium",
      labelEnabled: t('app.whiteLabel'),
      labelDisabled: t('app.whiteLabel'),
      class: 'max-w-xs w-80',
    },
    panel: {
      borderRadiusTop: false,
      borderRadiusBottom: false,
      flushedPanel: false,
      showArrowIcon: false,
      class: 'col-span-1 sm:col-span-2 max-w-xs w-80 sm:w-max sm:max-w-max'
    },
    appName: {
      label: t('app.appName'),
      ariaLabel: t('app.appName'),
      placeholder: t('app.appName'),
      class: 'max-w-xs col-span-1'
    },
    appUrl: {
      label: t('app.appUrl'),
      ariaLabel: t('app.appUrl'),
      placeholder: t('app.appUrl'),
      class: 'max-w-xs col-span-1'
    },
    defaultLanguage: {
      label: t('app.defaultLanguage'),
      ariaLabel: t('app.defaultLanguage'),
      placeholder: t('app.defaultLanguage'),
      options: languageOptions,
      class: 'max-w-xs'
    },
    logoLight: {
      label: t('app.logoLight'),
      ariaLabel: t('app.logoLight'),
      placeholder: t('app.logoLight'),
      class: 'max-w-xs'
    },
    logoDark: {
      label: t('app.logoDark'),
      ariaLabel: t('app.logoDark'),
      placeholder: t('app.logoDark'),
      class: 'max-w-xs'
    },
    useLogoLoader: {
      showLabel: true,
      size: 'small' as "small" | "large" | "medium",
      labelEnabled: t('app.useLogoLoader'),
      labelDisabled: t('app.useLogoLoader'),
      class: 'max-w-xs',
    },

    primaryColor: {
      label: t('app.primaryColor'),
      ariaLabel: t('app.primaryColor'),
      placeholder: t('app.primaryColor'),
      class: 'max-w-xs'
    },
    onPrimaryColor: {
      label: t('app.onPrimaryColor'),
      ariaLabel: t('app.onPrimaryColor'),
      placeholder: t('app.onPrimaryColor'),
      class: 'max-w-xs'
    },

  },
  ["loginProviders"]: {
    label: t('app.selectLoginProvider'),
    ariaLabel: t('app.selectLoginProvider'),
    placeholder: t('app.selectLoginProvider'),
    options: loginProviderOptions,
    multiple: true,
    showCheckBox: true,
    class: 'max-w-xs w-80'
  },
  ["adapters"]: {
    label: t('app.selectAdapters'),
    ariaLabel: t('app.selectAdapters'),
    placeholder: t('app.selectAdapters'),
    options: adapters,
    multiple: true,
    showCheckBox: true,
    class: 'max-w-xs w-80'
  },
  ["plugins"]: {
    label: t('app.selectPlugin'),
    ariaLabel: t('app.selectPlugin'),
    placeholder: t('app.selectPlugin'),
    options: plugins,
    class: 'max-w-xs w-80',
    multiple: true,
    showCheckBox: true
  },
  ["buttons"]: {
    btnGetAccounts: {
      label: t('app.buttons.btnGetAccounts'),
      ariaLabel: t('app.buttons.btnGetAccounts'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnnGetBalance"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSendEth"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSignEthMessage"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnGetConnectedChainId"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnAddChain"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSwitchChain"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSignAndSendTransaction"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSignTransaction"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSignMessage"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
    ["btnSignAllTransactions"]: {
      label: t('app.buttons.xxx'),
      ariaLabel: t('app.buttons.xxx'),
      class: '[w-full !h-auto group py-3 rounded-full flex items-center justify-center mb-4]',
      type: 'button',
      block: true,
      size: 'md',
      pill: true,
    },
  },
}

const chainIdOptions = ref<{ name: string, value: string }[]>([])

// Populate the private key provider based on the chain selected
const privateKeyProvider = computed((): IBaseProvider<string> => {

  const chainConfig = chainOptions[formData.value.chainNamespace as ChainNamespaceType].find((x) => x.chainId === formData.value.chain);
  if (!chainConfig) return null;

  switch (formData.value.chainNamespace) {
    case CHAIN_NAMESPACES.EIP155:
      return new EthereumPrivateKeyProvider({
        config: {
          chainConfig
        },
      });
    case CHAIN_NAMESPACES.SOLANA:
      return new SolanaPrivateKeyProvider({
        config: {
          chainConfig
        },
      });
    default:
      return null;
  }
});

// Options for reinitializing the web3Auth object
const options = computed((): Web3AuthOptions => {
  const { whiteLabel: { config: whiteLabel, enable: enabledWhiteLabel } } = formData.value;
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
  }
})

const modalParams = computed(() => {

  const excludedProviders = loginProviderOptions.filter((x) => !formData.value.loginProviders.includes(x.value)).map((x) => x.value);

  const modalConfig = {
    [WALLET_ADAPTERS.OPENLOGIN]: {
      label: "openlogin",
      loginMethods: Object.fromEntries(excludedProviders.map((x) => ([x, { name: `${x} login`, showOnModal: false }]))),
    }
  }
  console.log("modalConfig", modalConfig);
  return { modalConfig };
})

const getExternalAdapterByName = (name: string) => {
  switch (name) {
    case "coinbase":
      return new CoinbaseAdapter();
    case "metamask":
      return new MetamaskAdapter();
    case "openlogin":
      return new OpenloginAdapter({
        adapterSettings: {
          network: formData.value.network as WEB3AUTH_NETWORK_TYPE,
          clientId: clientIds[formData.value.network],
        },
      });
    case "phantom":
      return new PhantomAdapter();
    case "torus-evm":
      return new TorusWalletAdapter({
        adapterSettings: {
          buttonPosition: "bottom-left",
        },
        loginSettings: {
          verifier: "google",
        },
        initParams: {
          buildEnv: "testing",
        },
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x3",
          rpcTarget: "https://ropsten.infura.io/v3/776218ac4734478c90191dde8cae483c",
          displayName: "ropsten",
          blockExplorerUrl: "https://ropsten.etherscan.io/",
          ticker: "ETH",
          tickerName: "Ethereum",
        },
      });
    case "torus-solana":
      return new SolanaWalletAdapter({
        adapterSettings: {
          modalZIndex: 99999,
        },
        loginSettings: {
          loginProvider: "google",
        },
        initParams: {
          buildEnv: "testing",
        },
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          rpcTarget: "https://api.testnet.solana.com",
          blockExplorerUrl: "https://explorer.solana.com",
          chainId: "0x2",
          displayName: "testnet",
          ticker: "sol",
          tickerName: "solana",
        },
      })
    default:
      return null;
  }
}

// Init the web3Auth object 
const init = async () => {
  chainIdOptions.value = chainOptions[formData.value.chainNamespace as ChainNamespaceType].map((x) => ({ name: `${x.chainId} ${x.tickerName}`, value: x.chainId }))
  if (storageAvailable("sessionStorage") && sessionStorage.getItem("state"))
    formData.value = JSON.parse(sessionStorage.getItem("state") as string);
  if (!isInitialized) await initModal(modalParams.value);
}
init()

// Every time the form data changes, reinitialize the web3Auth object
watch(formData.value, async () => {
  chainIdOptions.value = chainOptions[formData.value.chainNamespace as ChainNamespaceType].map((x) => ({ name: `${x.chainId} ${x.tickerName}`, value: x.chainId }))
  if (!chainIdOptions.value.find(option => option.value == formData.value.chain)) formData.value.chain = chainIdOptions.value[0]?.value
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(formData.value));
  web3Auth.value?.clearCache()
  web3Auth.value = new Web3Auth(options.value);

  for (const adapter of formData.value.adapters) {
    const externalAdapter = getExternalAdapterByName(adapter);
    if (externalAdapter) web3Auth.value.configureAdapter(externalAdapter);
  }

  await initModal(modalParams.value);
});

watch(status, () => {
  console.log("status :::::::::::::::::::::::::::", status.value);
})

const enableMFA = async () => {
  await w3EnableMFA();
}

const getUserInfo = async () => {
  printToConsole("User Info", userInfo);
};

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
}

const onSignEthMessage = async () => {
  await signEthMessage(provider.value as IProvider, printToConsole);
}

const onGetAccounts = async () => {
  await getAccounts(provider.value as IProvider, printToConsole);
}

const getConnectedChainId = async () => {
  await getChainId(provider.value as IProvider, printToConsole);
}

const onGetBalance = async () => {
  await getBalance(provider.value as IProvider, printToConsole);
}

const onSwitchChain = async () => {
  try {
    await switchChain({ chainId: "0x89" });
    printToConsole("switchedChain");
  } catch (error) {
    console.error("error while switching chain", error);
    printToConsole("switchedChain error", error);
  }
}

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
    console.error("error while adding chain", error);
    printToConsole("add chain error", error);
  }
}

const onSignAndSendTransaction = async () => {
  await signAndSendTransaction(provider.value as IProvider, printToConsole);
}

const onSignTransaction = async () => {
  await signTransaction(provider.value as IProvider, printToConsole);
}

const onSignMessage = async () => {
  await signMessage(provider.value as IProvider, printToConsole);
}

const onSignAllTransactions = async () => {
  await signAllTransactions(provider.value as IProvider, printToConsole);
}


</script>

<template>
  <nav class="bg-white sticky top-0 z-50 w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="isConnected" @click="() => logout()"
          v-bind="{ block: true, size: 'xs', pill: true, variant: 'secondary' }">{{ $t("app.logout") }}</Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1">
        <div v-if="isConnected" class="max-sm:w-full">
          <h1 class="leading-tight text-3xl font-extrabold">{{ $t("app.title") }}</h1>
          <p class="leading-tight text-1xl">{{ $t("app.description") }} </p>
        </div>
      </div>
    </div>
  </nav>
  <main class="flex-1 p-1">
    <div class="relative">
      <div v-if="!isConnected" class="grid gap-0">
        <div class="col-span-8 sm:col-span-6 lg:col-span-4 mx-auto">
          <div class="text-3xl font-bold leading-tight mb-5 text-center">{{ $t("app.greeting") }}</div>

          <Card class="h-auto px-8 py-8 ">
            <div class="leading-tight text-2xl font-extrabold">{{ $t("app.w3aStatus", { status }) }}</div>
            <div class="text-app-gray-500 mt-2">{{ $t("app.isConnected", { isConnected }) }}</div>
            <div class="text-app-gray-500 mt-2">{{ $t("app.isInitialized", { isInitialized }) }}</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">

              <!-- <Select v-model="formData.authMode" v-bind="formConfig['authMode']" /> -->
              <Select v-model="formData.network" v-bind="formConfig['network']" />
              <Select v-model="formData.chainNamespace" v-bind="formConfig['chainNamespace']" />
              <Select v-model="formData.chain" v-bind="formConfig['chain']" :options="chainIdOptions" />
              <Select v-model="formData.loginProviders" v-bind="formConfig['loginProviders']" />
              <!-- <Select v-model="formData.plugins" v-bind="formConfig['plugins']" /> -->
              <Select v-model="formData.adapters" v-bind="formConfig['adapters']" />
              <ExpansionPanel v-bind="formConfig['whiteLabel'].panel" v-bind:expand="formData.whiteLabel.enable">
                <template #panelTitle>
                  <Toggle v-model="formData.whiteLabel.enable" v-bind="formConfig['whiteLabel'].enable" />
                </template>
                <template #panelBody>
                  <div class=" grid grid-cols-1 sm:grid-cols-2">
                    <TextField v-model="formData.whiteLabel.config.appName" v-bind="formConfig['whiteLabel'].appName" />
                    <TextField v-model="formData.whiteLabel.config.appUrl" v-bind="formConfig['whiteLabel'].appUrl" />
                    <Select v-model="formData.whiteLabel.config.defaultLanguage"
                      v-bind="formConfig['whiteLabel'].defaultLanguage" />
                    <TextField v-model="formData.whiteLabel.config.logoLight"
                      v-bind="formConfig['whiteLabel'].logoLight" />
                    <TextField v-model="formData.whiteLabel.config.logoDark"
                      v-bind="formConfig['whiteLabel'].logoDark" />
                    <Toggle id="useLogoLoader" v-bind="formConfig['whiteLabel'].useLogoLoader" />
                    <TextField :model-value="formData.whiteLabel.config.theme?.primary"
                      v-bind="formConfig['whiteLabel'].primaryColor">
                      <template #endIconSlot>
                        <input id="primary-color-picker" class="color-picker" type="color"
                          :value="formData.whiteLabel.config.theme?.primary" @input="(e) => {
                            const color = (e.target as InputHTMLAttributes).value;
                            formData.whiteLabel.config.theme = { ...formData.whiteLabel.config.theme, primary: color };
                          }
                            " />
                      </template>
                    </TextField>
                    <TextField :model-value="formData.whiteLabel.config.theme?.onPrimary"
                      v-bind="formConfig['whiteLabel'].onPrimaryColor">
                      <template #endIconSlot>
                        <input id="primary-color-picker" class="color-picker" type="color"
                          :value="formData.whiteLabel.config.theme?.onPrimary" @input="(e) => {
                            const color = (e.target as InputHTMLAttributes).value;
                            formData.whiteLabel.config.theme = { ...formData.whiteLabel.config.theme, onPrimary: color };
                          }
                            " />
                      </template>
                    </TextField>
                  </div>

                </template>
              </ExpansionPanel>
            </div>
            <div class="flex justify-center mt-5">
              <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                data-testid="loginButton" type="button" block size="md" pill @click="connect" :disabled="isConnected">
                Connect
              </Button>
            </div>
          </Card>
        </div>

      </div>
      <div v-else class="grid gap-0">
        <div class="grid grid-cols-8 gap-0">
          <div class="col-span-1"></div>
          <Card class="px-4 py-4 gird col-span-2">
            <div class="mb-4">
              <p class="btn-label">User info</p>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnGetAccounts']" @click="onGetAccounts">
                {{ t("app.buttons.btnGetAccounts") }}
              </Button>
            </div>
            <div class="mb-2">

              <Button :v-bind="formConfig['buttons']['btnnGetBalance']" @click="onGetBalance">
                {{ t("app.buttons.btnGetBalance") }}
              </Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSendEth']" @click="onSendEth">{{
                t("app.buttons.btnSendEth") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSignEthMessage']" @click="onSignEthMessage">{{
                t("app.buttons.btnSignEthMessage") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnGetConnectedChainId']" @click="getConnectedChainId">{{
                t("app.buttons.btnGetConnectedChainId") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnAddChain']" @click="onAddChain">{{
                t("app.buttons.btnAddChain") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSwitchChain']" @click="onSwitchChain">{{
                t("app.buttons.btnSwitchChain") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSignAndSendTransaction']" @click="onSignAndSendTransaction">{{
                t("app.buttons.btnSignAndSendTransaction") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSignTransaction']" @click="onSignTransaction">{{
                t("app.buttons.btnSignTransaction") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSignMessage']" @click="onSignMessage">{{
                t("app.buttons.btnSignMessage") }}</Button>
            </div>
            <div class="mb-2">
              <Button :v-bind="formConfig['buttons']['btnSignAllTransactions']" @click="onSignAllTransactions">{{
                t("app.buttons.btnSignAllTransactions") }}</Button>
            </div>
          </Card>
          <Card id="console" class="px-4 py-4 col-span-4 overflow-y-auto">
            <pre
              class="whitespace-pre-line overflow-x-auto font-normal text-base leading-6 text-black break-words overflow-y-auto max-h-screen">
      </pre>
            <div class="absolute top-2 right-8">
              <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
                block size="md" pill @click="clearConsole" data-testid="btnClearConsole">
                Clear console
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </main>
</template>
