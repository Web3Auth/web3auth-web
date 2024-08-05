<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });
import { Button, Card, Select, Toggle, TextField, ExpansionPanel } from '@toruslabs/vue-components';
import {
  WhiteLabelData,
  LANGUAGES,
  LANGUAGE_TYPE,
  LOGIN_PROVIDER_TYPE,
  storageAvailable,
} from "@toruslabs/openlogin-utils";
import { Web3AuthOptions, Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, ChainNamespaceType, IBaseProvider, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE, WALLET_ADAPTERS } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { chainNamespaceOptions, chainOptions, clientIds, initWhiteLabel, networkOptions, loginProviderOptions } from './config';
import { useWeb3Auth } from '@web3auth/modal-vue-composables';
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

const { web3Auth, isConnected, connect, isInitialized, initModal, logout, status } = useWeb3Auth()

const plugins = [
  { name: "wallet-services-plugin", value: "wallet-services-plugin" },
  { name: "solana-wallet-connector-plugin", value: "solana-wallet-connector-plugin" }
]


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


const adapters = [
  { name: "coinbase-adapter", value: "coinbase-adapter" },
  { name: "metamask-adapter", value: "metamask-adapter" },
  { name: "openlogin-adapter", value: "openlogin-adapter" },
  { name: "phantom-adapter", value: "phantom-adapter" },
  { name: "torus-evm-adapter", value: "torus-evm-adapter" },
  { name: "torus-solana-adapter", value: "torus-solana-adapter" },
  { name: "wallet-connect-v2-adapter", value: "wallet-connect-v2-adapter" },
]

const chainIdOptions = ref<{ name: string, value: string }[]>([])

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
      options: languages,
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
}

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
  const modalConfig = {
    [WALLET_ADAPTERS.OPENLOGIN]: {
      label: "openlogin",
      loginMethods: {
        google: {
          name: "google login",
          logoDark: "url to your custom logo which will shown in dark mode",
        },
        facebook: {
          // it will hide the facebook option from the Web3Auth modal.
          name: "facebook login",
          showOnModal: false,
        },
      },
      // setting it to false will hide all social login methods from modal.
      showOnModal: false,
    }
  }
  return { modalConfig };

})

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
  if (!chainIdOptions.value.find(option => option.value == formData.value.chain)) formData.value.chain = chainIdOptions.value[0].value
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(formData.value));
  web3Auth.value = new Web3Auth(options.value);

  web3Auth.value.configureAdapter(new OpenloginAdapter({
    adapterSettings: {
      network: formData.value.network as WEB3AUTH_NETWORK_TYPE,
      clientId: clientIds[formData.value.network],
    },
  }));

  await initModal();
});

watch(status, () => {
  console.log("status :::::::::::::::::::::::::::", status.value);
})

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
          <p class="leading-tight text-1xl">{{ $t("app.description") }}</p>
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
            <div class="leading-tight text-2xl font-extrabold">{{ $t("app.formHeader") }}</div>
            <div class="text-app-gray-500 mt-2">{{ $t("app.subHeading") }} {{ isConnected }} {{ isInitialized }} {{
              status }}</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">

              <!-- <Select v-model="formData.authMode" v-bind="formConfig['authMode']" /> -->
              <Select v-model="formData.network" v-bind="formConfig['network']" />
              <Select v-model="formData.chainNamespace" v-bind="formConfig['chainNamespace']" />
              <Select v-model="formData.chain" v-bind="formConfig['chain']" :options="chainIdOptions" />


              <Select v-model="formData.plugins" v-bind="formConfig['plugins']" />

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
              <Select v-model="formData.loginProviders" v-bind="formConfig['loginProviders']" />
              <Select v-model="formData.adapters" v-bind="formConfig['adapters']" />
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
    </div>
  </main>
</template>
