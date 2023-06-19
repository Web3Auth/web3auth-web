<template>
  <div class="flex flex-col lg:flex-row gap-4 p-7 h-full">
    <div class="form-container w-[462px] bg-app-white p-7 shadow-lg rounded-[20px] relative">
      <img :src="require('@/assets/demo_logo.svg')" alt="Web3Auth Demo Logo" />

      <div class="form-container-inner overflow-y-auto flex flex-col gap-6 mt-9">
        <Select
          v-model="form.authMode"
          :options="AuthModeOptions"
          label="Auth mode"
          pill
          :inputClasses="{
            inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
            input: '!border-0 focus:!border-0 !bg-app-select',
          }"
        />
        <Checkbox :checked="form.plugins.torusWallet" id="selectPlugin" label="Torus wallet UI plugin" :classes="{ label: '!text-app-gray-500' }" />

        <div v-if="form.authMode !== 'ownAuth'" class="flex flex-col gap-6">
          <Select
            v-model="form.openloginNetwork"
            :options="OpenLoginNetworkOptions"
            label="Openlogin network"
            pill
            :inputClasses="{
              inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
              input: '!border-0 focus:!border-0 !bg-app-select',
            }"
          />
          <Select
            v-model="form.chain"
            :options="ChainOptions"
            label="Select chain"
            pill
            :inputClasses="{
              inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
              input: '!border-0 focus:!border-0 !bg-app-select',
            }"
          />
          <Select
            v-model="form.selectedUiMode"
            :options="UIOptions"
            label="Select UI"
            pill
            :inputClasses="{
              inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
              input: '!border-0 focus:!border-0 !bg-app-select',
            }"
          />

          <div v-if="form.selectedUiMode === 'whitelabel'" class="flex flex-col gap-6">
            <TextField
              label="Logo URL"
              placeholder="Enter the Logo URL"
              v-model="form.uiMode.whitelabel.logoUrl"
              pill
              :classes="{
                inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
                input: '!border-0 focus:!border-0 !bg-app-select',
              }"
            />
            <Select
              v-model="form.uiMode.whitelabel.theme"
              :options="ThemeOptions"
              label="Select Theme"
              pill
              :inputClasses="{
                inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
                input: '!border-0 focus:!border-0 !bg-app-select',
              }"
            />
            <Select
              v-model="form.uiMode.whitelabel.defaultLanguage"
              :options="languages"
              label="Select Language"
              pill
              :inputClasses="{
                inputContainer: '!border-0 !rounded-full active:!border-0 !bg-app-select',
                input: '!border-0 focus:!border-0 !bg-app-select',
              }"
            />
            <div class="text-sm font-medium text-app-gray-900 -mb-4 flex items-center justify-between">
              <div>Login Methods Order</div>
              <div class="text-app-primary-600 cursor-pointer" @click="setDefaultLoginMethodsOrder">Set to default</div>
            </div>
            <TextArea
              v-model="tempLoginMethodsOrder"
              rows="4"
              :classes="{
                textAreaInput: '!border-0 focus:!border-0 !bg-app-select',
              }"
            />
          </div>
          <div v-else class="flex flex-col gap-6">
            <p class="text-sm font-medium text-app-gray-900">Social logins</p>
            <ul class="list">
              <li v-for="item in form.uiMode.default.login" :key="item.icon" class="list-item">
                <Checkbox
                  :id="item.icon"
                  :label="item.icon"
                  :checked="item.checked"
                  @on-change="
                    (isChecked) => {
                      item.checked = isChecked;
                      onSocialLoginChange(item.id);
                    }
                  "
                >
                  <template #checkboxLabel>
                    <div class="flex gap-2 items-center ml-2">
                      <Icon v-if="item.name.toLowerCase() === smsLoginProvider" name="tor-mail-icon" />
                      <Icon v-else-if="item.name.toLowerCase() === emailLoginProvider" name="tor-mail-icon" />
                      <img
                        v-else
                        class="w-4 h-4"
                        :src="`https://images.web3auth.io/login-${item?.name.toLowerCase()}-active.svg`"
                        :alt="`${item?.name} Icon`"
                      />
                      <p class="text-sm text-app-gray-500 capitalize">{{ item.name.replace("_passwordless", " ") }}</p>
                    </div>
                  </template>
                </Checkbox>
              </li>
            </ul>

            <p class="text-sm font-medium text-app-gray-900">External wallet</p>
            <div class="flex gap-2 items-center flex-wrap mb-6">
              <label
                v-for="walletType in form.uiMode.default.adapter"
                :key="walletType.id"
                :class="[
                  'bg-app-white cursor-pointer w-max px-3 py-1 border border-app-gray-200 flex items-center justify-center rounded-full shadow-md text-sm text-app-gray-500',
                  { 'border-app-primary-600': walletType.checked },
                ]"
              >
                <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" hidden />
                {{ walletType.name }}
              </label>
              <!-- <pre>{{ form.uiMode.default.adapter }}</pre> -->
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-7 w-full left-0 px-7">
        <Button pill block @click="saveConfig">Submit</Button>
      </div>
    </div>

    <div class="flex items-center justify-center flex-1 p-7">
      <!-- hosted auth -->
      <ConfigurableExample
        :plugins="config.plugins"
        :openloginNetwork="config.openloginNetwork"
        :adapterConfig="config.uiMode.default"
        :chain="config.chain"
        v-if="config.selectedUiMode === 'default' && config.authMode === 'hosted'"
      />
      <!-- WhiteLabel -->
      <WhitelabelExample
        :uiConfig="config.uiMode.whitelabel"
        :chain="config.chain"
        v-else-if="config.selectedUiMode === 'whitelabel' && config.authMode === 'hosted'"
      />
      <!-- Custom auth -->
      <CustomUiContainer :authType="config.uiMode.customUi.type" v-if="config.authMode === 'ownAuth'"></CustomUiContainer>
    </div>
  </div>
</template>

<script lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin-utils";
import { Button, Checkbox, Icon, Select, TextArea, TextField } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, ChainNamespaceType } from "@web3auth/base";
import { defaultEvmDappModalConfig, defaultSolanaDappModalConfig } from "@web3auth/modal";
import { cloneDeep } from "lodash";
import merge from "lodash.merge";
import { defineComponent } from "vue";

import CustomUiContainer from "@/customUi/customUiContainer.vue";
import ConfigurableExample from "@/default/configurableModal.vue";
import WhitelabelExample from "@/whitelabel/whitelabel.vue";

const DEFAULT_LOGIN_PROVIDERS = [
  LOGIN_PROVIDER.GOOGLE,
  LOGIN_PROVIDER.FACEBOOK,
  LOGIN_PROVIDER.TWITTER,
  LOGIN_PROVIDER.REDDIT,
  LOGIN_PROVIDER.DISCORD,
  LOGIN_PROVIDER.TWITCH,
  LOGIN_PROVIDER.APPLE,
  LOGIN_PROVIDER.LINE,
  LOGIN_PROVIDER.GITHUB,
  LOGIN_PROVIDER.KAKAO,
  LOGIN_PROVIDER.LINKEDIN,
  LOGIN_PROVIDER.WEIBO,
  LOGIN_PROVIDER.WECHAT,
  LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
  LOGIN_PROVIDER.SMS_PASSWORDLESS,
];

const defaultLoginProviders = () => {
  return DEFAULT_LOGIN_PROVIDERS.map((provider) => {
    return {
      id: provider,
      name: provider.substring(0, 1).toUpperCase() + provider.substring(1),
      checked: true,
    };
  });
};

const defaultAdapters = (chainNamespace: ChainNamespaceType) => {
  const adaptersConfig = chainNamespace === CHAIN_NAMESPACES.SOLANA ? defaultSolanaDappModalConfig : defaultEvmDappModalConfig;
  return Object.keys(adaptersConfig.adapters).map((adapterName) => {
    return {
      id: adapterName,
      name: adapterName.substring(0, 1).toUpperCase() + adapterName.substring(1),
      checked: true,
    };
  });
};

const defaultFormConfig = {
  chain: "ethereum",
  authMode: "hosted",
  selectedUiMode: "default",
  openloginNetwork: "testnet",
  plugins: {
    torusWallet: true,
  },
  uiMode: {
    default: {
      login: [...defaultLoginProviders()],
      loginMethodsOrder: DEFAULT_LOGIN_PROVIDERS,
      adapter: defaultAdapters(CHAIN_NAMESPACES.EIP155),
    },
    customUi: {
      type: "openlogin",
    },
    whitelabel: {
      logoUrl: "https://images.web3auth.io/example-hello.svg",
      theme: "light",
      loginMethodsOrder: DEFAULT_LOGIN_PROVIDERS,
      defaultLanguage: "en",
    },
  },
};

const configFromSessionStorage = () => {
  const storedConfig = JSON.parse(sessionStorage.getItem("web3AuthExampleConfig")) ?? {};
  return storedConfig;
};

const configFromURL = () => {
  const params = new URLSearchParams(document.location.search);
  const chainParams = params.get("chain");
  const authModeParams = params.get("auth");
  const whiteLabelParams = params.get("whitelabel");

  return {
    ...(["ethereum", "solana", "binance", "polygon"].includes(chainParams) && { chain: chainParams }),
    ...(authModeParams === "custom" && { authMode: "ownAuth" }),
    ...(whiteLabelParams === "yes" && { selectedUiMode: "whitelabel" }),
  };
};

const initialFormConfig = {
  ...defaultFormConfig,
  ...configFromSessionStorage(),
  ...configFromURL(),
};

export default defineComponent({
  name: "HomePage",
  components: {
    Button,
    Checkbox,
    Icon,
    Select,
    TextArea,
    TextField,
    ConfigurableExample,
    WhitelabelExample,
    CustomUiContainer,
  },
  data() {
    return {
      // storing config collected from user input.
      form: { ...initialFormConfig },
      // sending to other components
      config: { ...cloneDeep(initialFormConfig) },
      tempLoginMethodsOrder: initialFormConfig.uiMode?.whitelabel.loginMethodsOrder.join(",") ?? "",
      emailLoginProvider: LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
      smsLoginProvider: LOGIN_PROVIDER.SMS_PASSWORDLESS,
      AuthModeOptions: [
        { name: "Hosted", value: "hosted" },
        { name: "OwnAuth", value: "ownAuth" },
      ],
      OpenLoginNetworkOptions: [
        { name: "Mainnet", value: "mainnet" },
        { name: "Testnet", value: "testnet" },
        { name: "Cyan", value: "cyan" },
      ],
      ChainOptions: [
        { name: "Ethereum", value: "ethereum" },
        { name: "Solana", value: "solana" },
        { name: "Binance", value: "binance" },
        { name: "Polygon", value: "polygon" },
      ],
      UIOptions: [
        { name: "Default", value: "default" },
        { name: "WhiteLabel", value: "whitelabel" },
      ],
      ThemeOptions: [
        { name: "Default", value: "default" },
        { name: "Dark", value: "dark" },
        { name: "Light", value: "light" },
      ],
      languages: [
        {
          value: "en",
          name: "English",
        },
        {
          value: "de",
          name: "German",
        },
        {
          value: "ja",
          name: "Japanese",
        },
        {
          value: "ko",
          name: "Korean",
        },
        {
          value: "zh",
          name: "Mandarin",
        },
        {
          value: "es",
          name: "Spanish",
        },
        {
          value: "fr",
          name: "French",
        },
        {
          value: "pt",
          name: "Portuguese",
        },
        {
          value: "nl",
          display: "Dutch",
        },
      ],
    };
  },
  watch: {
    "form.authMode"(val) {
      const formValURLSearchParamMap = { ownAuth: "custom", hosted: "default" };
      this.updateURL("auth", formValURLSearchParamMap[val]);
    },
    "form.chain"(val) {
      this.updateURL("chain", val);
    },
    "form.selectedUiMode"(val) {
      const formValURLSearchParamMap = { whitelabel: "yes", default: "no" };
      this.updateURL("whitelabel", formValURLSearchParamMap[val]);
    },
  },
  methods: {
    onAuthModeSelection: function (item: string) {
      console.log(item);
      this.form.authMode = item;
    },
    onOpenloginNetworkSelection: function (item: string) {
      console.log(item);
      this.form.openloginNetwork = item;
    },
    onChainSelection: function (item: string) {
      console.log(item);
      this.form.chain = item;
    },
    onUiSelection: function (item: string) {
      console.log(item);
      this.form.selectedUiMode = item;
    },
    onThemeSelection: function (item: string) {
      console.log(item);
      this.form.uiMode.whitelabel.theme = item;
    },
    onLanguageSelection: function (item: string) {
      this.form.uiMode.whitelabel.defaultLanguage = item;
    },
    onSocialLoginChange: function (item: string) {
      if (this.form.uiMode.default.loginMethodsOrder.includes(item)) {
        this.form.uiMode.default.loginMethodsOrder = this.form.uiMode.default.loginMethodsOrder.filter((login) => login !== item);
      } else {
        this.form.uiMode.default.loginMethodsOrder.push(item);
      }
    },
    saveConfig: function () {
      this.form.uiMode.whitelabel.loginMethodsOrder = this.tempLoginMethodsOrder.split(",") as typeof DEFAULT_LOGIN_PROVIDERS;
      sessionStorage.setItem("web3AuthExampleConfig", JSON.stringify(this.form || {}));
      this.config = merge({}, this.form);
      console.log("config saved", this.config);
      // location.reload();
    },
    setDefaultLoginMethodsOrder: function () {
      this.tempLoginMethodsOrder = DEFAULT_LOGIN_PROVIDERS.join(",");
    },
    updateURL(searchParamKey, searchParamValue) {
      const url = new URL(window.location.href);
      url.searchParams.set(searchParamKey, searchParamValue);
      window.history.replaceState(null, null, url.toString());
    },
  },
});
</script>

<style>
.form-container {
  height: calc(100vh - 56px);
}

.form-container-inner {
  height: calc(100% - 140px);
}

.list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
}

.list-item {
  flex: 0 0 50%;
  margin-bottom: 0.7rem;
}

.selectPlugin {
  color: #6f717a !important;
}

.border-select {
  border: 0px !important;
}
</style>
