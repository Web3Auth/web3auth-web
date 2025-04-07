<script setup lang="ts">
import { Button, Card, Select, Tab, Tabs, Tag, TextField, Toggle } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, ChainNamespaceType, CONNECTOR_STATUS, getChainConfig, log } from "@web3auth/modal";
import { useWeb3Auth } from "@web3auth/modal/vue";
import { computed, InputHTMLAttributes, ref } from "vue";
import {
  chainConfigs,
  chainNamespaceOptions,
  clientIds,
  confirmationStrategyOptions,
  getDefaultBundlerUrl,
  languageOptions,
  loginProviderOptions,
  networkOptions,
  SmartAccountOptions,
} from "../config";
import { formDataStore } from "../store/form";

const formData = formDataStore;

const { status, isConnected, isInitialized, connect } = useWeb3Auth();
const chainOptions = computed(() => {
  const allChains: { name: string; value: string }[] = [];
  formData.chainNamespaces.forEach((namespace: ChainNamespaceType) => {
    const chainsForNamespace = chainConfigs[namespace].map((chainId) => {
      const chainConfig = getChainConfig(namespace, chainId, clientIds[formData.network]);
      if (!chainConfig) {
        throw new Error(`Chain config not found for chainId: ${chainId}`);
      }
      return {
        name: `${chainId} ${chainConfig.displayName}`,
        value: chainId,
      };
    });
    allChains.push(...chainsForNamespace);
  });
  return allChains;
});

const defaultChainOptions = computed(() => {
  return formData.chains.map((chain) => ({ name: chain, value: chain }));
});

const aaSupportedChains = computed(() => {
  return formData.chains
    .map((chainId) => {
      return getChainConfig(CHAIN_NAMESPACES.EIP155, chainId, clientIds[formData.network]);
    })
    .filter((chainConfig) => chainConfig)
    .map((chainConfig) => ({ name: `${chainConfig!.chainId} ${chainConfig!.displayName}`, value: chainConfig!.chainId }));
});

const adapterOptions = computed(() =>
  formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155) ? [{ name: "coinbase-adapter", value: "coinbase" }] : []
);

const isDisplay = (_name: string): boolean => {
  return !isConnected.value;
};

const isDisabled = (name: string): boolean => {
  switch (name) {
    case "whiteLabelSettings":
      return !formData.whiteLabel.enable;

    case "walletServicePlugin":
      return !formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155) && !formData.chainNamespaces.includes(CHAIN_NAMESPACES.SOLANA);

    case "nftCheckoutPlugin":
      return !formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155);

    case "btnConnect":
      return !isInitialized.value;

    case "smartAccountType":
    case "smartAccountChains":
    case "bundlerUrl":
    case "paymasterUrl":
    case "useAAWithExternalWallet":
      return !formData.useAccountAbstractionProvider;

    case "accountAbstraction":
      return !formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155);

    default: {
      return false;
    }
  }
};

const activeTab = ref(0);
const onTabChange = (index: number) => {
  activeTab.value = index;
};
const isActiveTab = (index: number) => activeTab.value === index;

const onChainNamespaceChange = (value: string[]) => {
  log.info("onChainNamespaceChange", value);
  formData.chains = value.map((namespace) => chainConfigs[namespace as ChainNamespaceType][0]);
  onChainChange(formData.chains);
  formData.connectors = [];
};

const onChainChange = (chainIds: string[]) => {
  log.info("onChainChange", chainIds);
  // update default chain Id if not found in the new chains
  if (formData.defaultChainId && chainIds.includes(formData.defaultChainId)) {
    formData.defaultChainId = chainIds[0];
  }
  // update smart account chains if not found in the new chains
  formData.smartAccountChains = formData.smartAccountChains.filter((chain) => chainIds.includes(chain));
};

const onSmartAccountChainChange = (chainIds: string[]) => {
  log.info("onSmartAccountChainChange", chainIds);
  formData.smartAccountChainsConfig = {};
  for (const chainId of chainIds) {
    if (!formData.smartAccountChainsConfig[chainId]) {
      formData.smartAccountChainsConfig[chainId] = {
        bundlerUrl: getDefaultBundlerUrl(chainId),
        paymasterUrl: "",
      };
    }
  }
};
</script>

<template>
  <div class="flex !flex-col sm:!flex-row items-center justify-center gap-6 px-10 py-4">
    <div v-if="isDisplay('form')">
      <Card
        class="h-auto p-4 sm:p-8 col-span-8 sm:col-span-6 lg:col-span-4 max-sm:!shadow-none max-sm:!border-0 !w-full [@media(min-width:900px)]:!min-w-[700px] [@media(min-width:1200px)]:!min-w-[800px] [@media(min-width:1500px)]:!w-[800px]"
      >
        <div class="text-2xl font-bold leading-tight text-center sm:text-3xl">{{ $t("app.greeting") }}</div>
        <div class="my-4 font-extrabold leading-tight text-center flex items-center justify-center gap-2">
          <Select
            v-model="formData.widget"
            data-testid="selectWidget"
            :aria-label="$t('app.widget.title')"
            :placeholder="$t('app.widget.title')"
            :options="[
              { name: $t('app.widget.embed'), value: 'embed' },
              { name: $t('app.widget.modal'), value: 'modal' },
            ]"
            :classes="{
              container: '!w-[120px]',
            }"
          />
          <Tag v-bind="{ minWidth: 'inherit' }" :class="['uppercase', { '!bg-blue-400 text-white': status === CONNECTOR_STATUS.READY }]">
            {{ status }}
          </Tag>
          &nbsp;
          <Tag v-bind="{ minWidth: 'inherit' }" :class="['uppercase', { '!bg-blue-400 text-white': isInitialized }]">
            {{ isInitialized ? "INITIALIZED" : "NOT_INITIALIZE_YET" }}
          </Tag>
        </div>
        <Tabs class="mb-4">
          <Tab variant="underline" :active="isActiveTab(0)" @click="onTabChange(0)">General</Tab>
          <Tab variant="underline" :active="isActiveTab(1)" @click="onTabChange(1)">WhiteLabel</Tab>
          <Tab variant="underline" :active="isActiveTab(2)" @click="onTabChange(2)">Login Provider</Tab>
          <Tab
            v-if="formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155) || formData.chainNamespaces.includes(CHAIN_NAMESPACES.SOLANA)"
            variant="underline"
            :active="isActiveTab(3)"
            @click="onTabChange(3)"
          >
            Wallet Plugin
          </Tab>
          <Tab v-if="formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155)" variant="underline" :active="isActiveTab(4)" @click="onTabChange(4)">
            NFT Checkout Plugin
          </Tab>
          <Tab v-if="formData.chainNamespaces.includes(CHAIN_NAMESPACES.EIP155)" variant="underline" :active="isActiveTab(5)" @click="onTabChange(5)">
            Account Abstraction Provider
          </Tab>
        </Tabs>
        <Card v-if="isActiveTab(0)" class="grid grid-cols-1 gap-2 px-4 py-4" :shadow="false">
          <Select
            v-model="formData.network"
            data-testid="selectNetwork"
            :label="$t('app.network')"
            :aria-label="$t('app.network')"
            :placeholder="$t('app.network')"
            :options="networkOptions"
          />
          <Select
            v-model="formData.chainNamespaces"
            data-testid="selectChainNamespace"
            :label="$t('app.chainNamespaces')"
            :aria-label="$t('app.chainNamespaces')"
            :placeholder="$t('app.chainNamespaces')"
            :options="chainNamespaceOptions"
            :multiple="true"
            @update:model-value="onChainNamespaceChange"
          />
          <Select
            v-model="formData.chains"
            data-testid="selectChain"
            :label="$t('app.chains')"
            :aria-label="$t('app.chains')"
            :placeholder="$t('app.chains')"
            :multiple="true"
            :options="chainOptions"
            @update:model-value="onChainChange"
          />
          <Select
            v-model="formData.defaultChainId"
            data-testid="selectDefaultChainId"
            :label="$t('app.defaultChainId')"
            :aria-label="$t('app.defaultChainId')"
            :placeholder="$t('app.defaultChainId')"
            :options="defaultChainOptions"
          />
          <Select
            v-model="formData.connectors"
            data-testid="selectAdapters"
            :label="$t('app.adapters')"
            :aria-label="$t('app.adapters')"
            :placeholder="$t('app.adapters')"
            :options="adapterOptions"
            multiple
            :show-check-box="true"
          />
          <Toggle
            v-model="formData.showWalletDiscovery"
            data-testid="showWalletDiscovery"
            :show-label="true"
            :size="'small'"
            :label-disabled="$t('app.showWalletDiscovery')"
            :label-enabled="$t('app.showWalletDiscovery')"
            class="mb-2"
          />
          <Toggle
            v-model="formData.multiInjectedProviderDiscovery"
            data-testid="multiInjectedProviderDiscovery"
            :show-label="true"
            :size="'small'"
            :label-disabled="$t('app.multiInjectedProviderDiscovery')"
            :label-enabled="$t('app.multiInjectedProviderDiscovery')"
            class="mb-2"
          />
        </Card>
        <Card v-if="isActiveTab(1)" class="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-2" :shadow="false">
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
        <Card v-if="isActiveTab(2)" class="grid grid-cols-1 gap-2 px-4 py-4" :shadow="false">
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
          <Card v-for="p in formData.loginProviders" :key="p" :shadow="false" class="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-3">
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
        <Card v-if="isActiveTab(3)" class="grid grid-cols-1 gap-2 px-4 py-4" :shadow="false">
          <Toggle
            v-model="formData.walletPlugin.enable"
            :disabled="isDisabled('walletServicePlugin')"
            :show-label="true"
            :size="'small'"
            :label-disabled="$t('app.walletPlugin.title')"
            :label-enabled="$t('app.walletPlugin.title')"
            class="mb-2"
          />
          <Select
            v-model="formData.walletPlugin.confirmationStrategy"
            data-testid="selectLoginProviders"
            :label="$t('app.walletPlugin.confirmationStrategy')"
            :aria-label="$t('app.walletPlugin.confirmationStrategy')"
            :placeholder="$t('app.walletPlugin.confirmationStrategy')"
            :options="confirmationStrategyOptions"
            class=""
          />
        </Card>
        <Card v-if="isActiveTab(4)" class="grid grid-cols-1 gap-2 px-4 py-4" :shadow="false">
          <Toggle
            v-model="formData.nftCheckoutPlugin.enable"
            :disabled="isDisabled('nftCheckoutPlugin')"
            :show-label="true"
            :size="'small'"
            :label-disabled="$t('app.nftCheckoutPlugin.title')"
            :label-enabled="$t('app.nftCheckoutPlugin.title')"
            class="mb-2"
          />
        </Card>
        <Card v-if="isActiveTab(5)" class="grid grid-cols-1 gap-2 px-4 py-4" :shadow="false">
          <Toggle
            v-model="formData.useAccountAbstractionProvider"
            data-testid="accountAbstractionProvider"
            :show-label="true"
            :size="'small'"
            :label-disabled="$t('app.accountAbstractionProvider.title')"
            :label-enabled="$t('app.accountAbstractionProvider.title')"
            class="my-2"
          />
          <Toggle
            v-model="formData.useAAWithExternalWallet"
            data-testid="useAAWithExternalWallet"
            :show-label="true"
            :size="'small'"
            :label-disabled="$t('app.accountAbstractionProvider.useAAWithExternalWallet')"
            :label-enabled="$t('app.accountAbstractionProvider.useAAWithExternalWallet')"
            class="my-2"
            :disabled="isDisabled('useAAWithExternalWallet')"
          />
          <Select
            v-model="formData.smartAccountType"
            data-testid="smartAccountType"
            :label="$t('app.accountAbstractionProvider.smartAccountType')"
            :aria-label="$t('app.accountAbstractionProvider.smartAccountType')"
            :placeholder="$t('app.accountAbstractionProvider.smartAccountType')"
            :options="SmartAccountOptions"
            :disabled="isDisabled('smartAccountType')"
          />
          <Select
            v-model="formData.smartAccountChains"
            data-testid="selectSmartAccountChains"
            :label="$t('app.chains')"
            :aria-label="$t('app.chains')"
            :placeholder="$t('app.chains')"
            :options="aaSupportedChains"
            multiple
            :disabled="isDisabled('smartAccountChains')"
            @update:model-value="onSmartAccountChainChange"
          />
          <Card v-for="c in formData.smartAccountChains" :key="c" :shadow="false" class="gap-2 px-4 py-4">
            <div class="font-bold leading-tight text-left sm:col-span-2">{{ c }}</div>
            <TextField
              class="mt-3"
              v-model="formData.smartAccountChainsConfig[c].bundlerUrl"
              :label="$t('app.accountAbstractionProvider.bundlerUrl')"
              :aria-label="$t('app.accountAbstractionProvider.bundlerUrl')"
              :placeholder="$t('app.accountAbstractionProvider.bundlerUrl')"
              :disabled="isDisabled('bundlerUrl')"
            />
            <TextField
              class="mt-3"
              v-model="formData.smartAccountChainsConfig[c].paymasterUrl"
              :label="$t('app.accountAbstractionProvider.paymasterUrl')"
              :aria-label="$t('app.accountAbstractionProvider.paymasterUrl')"
              :placeholder="$t('app.accountAbstractionProvider.paymasterUrl')"
              :disabled="isDisabled('paymasterUrl')"
            />
          </Card>
        </Card>
        <div class="flex justify-center mt-5">
          <Button
            v-if="formData.widget === 'modal'"
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
        <div class="px-0 mt-4 mb-5 text-sm font-normal text-app-gray-900 dark:text-app-gray-200">
          Reach out to us at
          <a class="underline text-app-primary-600 dark:text-app-primary-500" href="mailto:hello@tor.us">hello@tor.us</a>
          or
          <a class="underline text-app-primary-600 dark:text-app-primary-500" href="https://t.me/torusdev">telegram group</a>
          .
        </div>
      </Card>
    </div>
    <div
      v-if="formData.widget === 'embed'"
      id="w3a-parent-test-container"
      class="flex flex-col items-center justify-center mt-10 xs:mt-0 !w-full [@media(min-width:375px)]:!max-w-[500px]"
    ></div>
  </div>
</template>
