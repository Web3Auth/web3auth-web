<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });
import { Button, Card, Select, Toggle, TextField, Loader } from '@toruslabs/vue-components';
import {
  OPENLOGIN_NETWORK,
  OPENLOGIN_NETWORK_TYPE,
  WhiteLabelData,
  LANGUAGES,
  LANGUAGE_TYPE,
  LOGIN_PROVIDER,
  LOGIN_PROVIDER_TYPE,
  storageAvailable
} from "@toruslabs/openlogin-utils";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { CustomChainConfig, CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumPrivateKeyProvider, } from "@web3auth/ethereum-provider";

const authModes = [
  { name: "hosted", value: "hosted" },
  { name: "ownAuth", value: "ownAuth" }
]

const plugins = [
  { name: "wallet-services-plugin", value: "wallet-services-plugin" },
  { name: "solana-wallet-connector-plugin", value: "solana-wallet-connector-plugin" }
]
const openloginNetworks = Object.values(OPENLOGIN_NETWORK).map((x) => ({ name: x, value: x }))
const chains = [
  { name: "ethereum", value: "ethereum" },
  { name: "solana", value: "solana" },
  { name: "binance", value: "binance" },
  { name: "polygon", value: "polygon" }
]
const whiteLabel: WhiteLabelData = {
  appName: "HelloDemo",
  appUrl: "http://localhost:8080",
  logoDark: "https://images.web3auth.io/example-hello.svg", // dark logo for light background
  logoLight: "https://images.web3auth.io/example-hello-light.svg", // light logo for dark background
  mode: "auto",
  defaultLanguage: "en",
  theme: {
    primary: "#5DF0EB",
    onPrimary: "black",
  },
};
const languages: { name: string; value: LANGUAGE_TYPE }[] = [
  { name: "English", value: LANGUAGES.en },
  { name: "German", value: LANGUAGES.de },
  { name: "Japanese", value: LANGUAGES.ja },
  { name: "Korean", value: LANGUAGES.ko },
  { name: "Mandarin", value: LANGUAGES.zh },
  { name: "Spanish", value: LANGUAGES.es },
  { name: "French", value: LANGUAGES.fr },
  { name: "Portuguese", value: LANGUAGES.pt },
  { name: "Dutch", value: LANGUAGES.nl },
  { name: "Turkish", value: LANGUAGES.tr },
];

const loginProviders = Object.values(LOGIN_PROVIDER).filter((x) => x !== "jwt" && x !== "webauthn").map((x) => ({ name: x.replaceAll('_', ' '), value: x }))
const adapters = [
  { name: "coinbase-adapter", value: "coinbase-adapter" },
  { name: "metamask-adapter", value: "metamask-adapter" },
  { name: "openlogin-adapter", value: "openlogin-adapter" },
  { name: "phantom-adapter", value: "phantom-adapter" },
  { name: "torus-evm-adapter", value: "torus-evm-adapter" },
  { name: "torus-solana-adapter", value: "torus-solana-adapter" },
  { name: "wallet-connect-v2-adapter", value: "wallet-connect-v2-adapter" },
]

const clientIds: Record<OPENLOGIN_NETWORK_TYPE, string> = {
  [OPENLOGIN_NETWORK.MAINNET]: "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA",
  [OPENLOGIN_NETWORK.TESTNET]: "BHr_dKcxC0ecKn_2dZQmQeNdjPgWykMkcodEHkVvPMo71qzOV6SgtoN8KCvFdLN7bf34JOm89vWQMLFmSfIo84A",
  [OPENLOGIN_NETWORK.AQUA]: "BM34K7ZqV3QwbDt0lvJFCdr4DxS9gyn7XZ2wZUaaf0Ddr71nLjPCNNYtXuGWxxc4i7ivYdgQzFqKlIot4IWrWCE",
  [OPENLOGIN_NETWORK.CYAN]: "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk",
  [OPENLOGIN_NETWORK.SAPPHIRE_DEVNET]: "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw",
  [OPENLOGIN_NETWORK.SAPPHIRE_MAINNET]: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
  [OPENLOGIN_NETWORK.CELESTE]: "openlogin",
};

type FormData = {
  authMode: string | null;
  plugins: string[];
  network: OPENLOGIN_NETWORK_TYPE;
  chain: string | null;
  whiteLabel: {
    enable: boolean;
    config: WhiteLabelData;
  };
  loginProviders: LOGIN_PROVIDER_TYPE[];
  adapters: string[];
};

const privKey = ref<string | null>("");
const isLogged = computed(() => !!privKey.value);
const logout = () => {
  privKey.value = null;
};

const formConfig = {
  ["authMode"]: {
    ["data-testid"]: "authMode",
    label: t('app.selectAuthMode'),
    ariaLabel: t('app.selectAuthMode'),
    placeholder: t('app.selectAuthMode'),
    options: authModes,
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
  ["network"]: {
    label: t('app.selectNetwork'),
    ariaLabel: t('app.selectNetwork'),
    placeholder: t('app.selectNetwork'),
    options: openloginNetworks,
    class: 'max-w-xs w-80'
  },
  ["chain"]: {
    label: t('app.selectChain'),
    ariaLabel: t('app.selectChain'),
    placeholder: t('app.selectChain'),
    options: chains,
    class: 'max-w-xs w-80'
  },
  ["whiteLabel"]: {
    enable: {
      showLabel: true,
      size: 'small',
      labelDisabled: t('app.whiteLabel'),
      labelEnabled: t('app.whiteLabel'),
      class: 'max-w-xs w-80'
    },
    card: {
      shadow: false,
      class: 'col-span-1 sm:col-span-2 grid grid-cols-1 h-auto px-4 py-4'
    }
  },
  ["loginProviders"]: {
    label: t('app.selectLoginProvider'),
    ariaLabel: t('app.selectLoginProvider'),
    placeholder: t('app.selectLoginProvider'),
    options: loginProviders,
    multiple: true,
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
  }
}

const formData = ref<FormData>({
  authMode: null,
  plugins: [],
  network: OPENLOGIN_NETWORK.TESTNET,
  chain: CHAIN_NAMESPACES.EIP155,
  whiteLabel: {
    enable: false,
    config: whiteLabel
  },
  loginProviders: [],
  adapters: []
});

const isWeb3AuthInitialized = ref<boolean>(false);
const web3auth = ref<Web3Auth | null>(null);
// const selectedAuthMode = ref<string | null>(null);
// const selectedPlugin = ref<string | null>(null);
// const selectedNetwork = ref<OPENLOGIN_NETWORK_TYPE>(OPENLOGIN_NETWORK.TESTNET);
// const selectedChain = ref<string | null>(null);
// const isWhiteLabelEnabled = ref<boolean>(false);
// const whitelabelConfig = ref<WhiteLabelData>(whiteLabel);
// const selectedLoginProvider = ref<LOGIN_PROVIDER_TYPE | null>(null);
// const selectedAdapters = ref<string[]>([]);
// const web3auth = ref<Web3Auth>(null);
const ethereumChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  rpcTarget: "https://rpc.ankr.com/eth",
  blockExplorerUrl: "https://etherscan.io",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  chainId: "0x1",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig: {
      chainId: "0x1",
      rpcTarget: `https://rpc.ankr.com/eth`,
      displayName: "Mainnet",
      blockExplorerUrl: "https://etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      chainNamespace: "eip155",
    },
  },
});

const ethWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: ethereumChainConfig,
  clientId: clientIds[OPENLOGIN_NETWORK.SAPPHIRE_DEVNET],
  privateKeyProvider: ethereumPrivateKeyProvider,
  enableLogging: true,
};


const w3AOptions = computed((): Web3AuthOptions => {

  const config: Web3AuthOptions = {
    uiConfig: {
      uxMode: "popup",
    },
    privateKeyProvider: ethereumPrivateKeyProvider
  }

  console.log(ethWeb3AuthOptions)
  return config
})

const connect = async () => {
  console.info("connect");
  try {
    await web3auth.value?.connect();
  } catch (error) {
    console.error(error);
  }
};

const initWeb3Auth = async () => {
  console.info("initWeb3Auth");
  try {
    isWeb3AuthInitialized.value = false;
    const w3A = new Web3Auth(w3AOptions.value);
    await w3A.initModal();
    web3auth.value = w3A;
    isWeb3AuthInitialized.value = true;
  } catch (error) {
    console.error("error", error);
    isWeb3AuthInitialized.value = false;
  }
}

const init = async () => {
  if (storageAvailable("sessionStorage"))
    formData.value = JSON.parse(sessionStorage.getItem("state") || "{}");
  await initWeb3Auth();
}
init()

watch(formData.value, async () => {
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(formData.value));
  await initWeb3Auth();

});


</script>

<template>
  <nav class="bg-white sticky top-0 z-50 w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="isLogged" @click="logout"
          v-bind="{ block: true, size: 'xs', pill: true, variant: 'secondary' }">{{ $t("app.logout") }}</Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1">
        <div v-if="isLogged" class="max-sm:w-full">
          <h1 class="leading-tight text-3xl font-extrabold">{{ $t("app.title") }}</h1>
          <p class="leading-tight text-1xl">{{ $t("app.description") }}</p>
        </div>
      </div>
    </div>
  </nav>
  <main class="flex-1 p-1">
    <div class="relative">
      <div v-if="!isLogged" class="grid gap-0">
        <div class="col-span-8 sm:col-span-6 lg:col-span-4 mx-auto">
          <div class="text-3xl font-bold leading-tight mb-5 text-center">{{ $t("app.greeting") }}</div>

          <Card class="h-auto px-8 py-8 ">
            <div class="leading-tight text-2xl font-extrabold">{{ $t("app.formHeader") }}</div>
            <div class="text-app-gray-500 mt-2">{{ $t("app.subHeading") }}</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
              <Select v-model="formData.authMode" v-bind="formConfig['authMode']" />
              <Select v-model="formData.plugins" v-bind="formConfig['plugins']" />
              <Select v-model="formData.network" v-bind="formConfig['network']" />
              <Select v-model="formData.chain" v-bind="formConfig['chain']" />
              <Toggle v-model="formData.whiteLabel.enable" v-bind="formConfig['whiteLabel'].enable" />
              <Card v-if="formData.whiteLabel.enable" v-bind="formConfig['whiteLabel'].card">
                <div class="leading-tight text-xl font-extrabold">Whitelabel Setting</div>
                <div class="text-app-gray-500 mt-2">Customize the look and feel of the Openlogin modal.</div>
                <div class="mt-3">
                  <TextField v-model="formData.whiteLabel.appName" data-testid="appName" class="mt-3"
                    label="Enter App Name" aria-label="Enter App Name" placeholder="Enter App Name" />
                </div>
                <div class="mt-3">
                  <TextField v-model="formData.whiteLabel.appUrl" data-testid="appUrl" class="mt-3"
                    label="Enter App URL" aria-label="Enter App URL" placeholder="Enter App URL" />
                </div>
                <div class="mt-3">
                  <Select v-model="formData.whiteLabel.defaultLanguage" data-testid="defaultLanguage" class="mt-3"
                    label="Select Language*" aria-label="Select Language*" placeholder="Select Language"
                    :options="Object.values(languages)"
                    :helper-text="`Selected Language: ${formData.whiteLabel.defaultLanguage}`"
                    :error="!formData.whiteLabel.defaultLanguage" />
                </div>
                <div class="mt-3">
                  <TextField v-model="formData.whiteLabel.logoLight" data-testid="logoLight" class="mt-3"
                    label="Enter logo url" aria-label="Enter logo url" placeholder="Enter logo url" />
                </div>
                <div class="mt-3">
                  <TextField v-model="formData.whiteLabel.logoDark" data-testid="logoDark" class="mt-3"
                    label="Enter dark logo url" aria-label="Enter dark logo url" placeholder="Enter dark logo url" />
                </div>
                <div class="mt-3">
                  <Toggle id="useLogoLoader" data-testid="useLogoLoader" v-model="formData.whiteLabel.useLogoLoader"
                    :show-label="true" :size="'small'" :label-disabled="'Use Logo Loader'"
                    :label-enabled="'Use Logo Loader'" />
                </div>
                <div class="mt-3">
                  <TextField :model-value="formData.whiteLabel.theme?.primary" data-testid="primaryColor" class="mt-3"
                    label="Enter primary color" aria-label="Enter primary color" placeholder="Enter primary color">
                    <template #endIconSlot>
                      <input id="primary-color-picker" class="color-picker" type="color"
                        :value="formData.whiteLabel.theme?.primary" @input="(e) => {
                          const color = (e.target as InputHTMLAttributes).value;
                          formData.whiteLabel.theme = { ...formData.whiteLabel.theme, primary: color };
                        }
                          " />
                    </template>
                  </TextField>
                </div>
                <div class="mt-3">
                  <TextField :model-value="formData.whiteLabel.theme?.onPrimary" data-testid="onPrimaryColor"
                    class="mt-3" label="Enter primary color" aria-label="Enter primary color"
                    placeholder="Enter primary color">
                    <template #endIconSlot>
                      <input id="primary-color-picker" class="color-picker" type="color"
                        :value="formData.whiteLabel.theme?.onPrimary" @input="(e) => {
                          const color = (e.target as InputHTMLAttributes).value;
                          formData.whiteLabel.theme = { ...formData.whiteLabel.theme, onPrimary: color };
                        }
                          " />
                    </template>
                  </TextField>
                </div>
              </Card>
              <Select v-model="formData.loginProviders" v-bind="formConfig['loginProviders']" />
              <Select v-model="formData.adapters" v-bind="{
                label: $t('app.selectAdapters'),
                ariaLabel: $t('app.selectAdapters'),
                placeholder: $t('app.selectAdapters'),
                options: adapters,
                multiple: true,
                showCheckBox: true,
                class: 'max-w-xs w-80'
              }" />
            </div>
            <div class="flex justify-center mt-5">
              <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                data-testid="loginButton" type="button" block size="md" pill @click="connect" :disabled="!isWeb3AuthInitialized">
                Connect
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  </main>
</template>
