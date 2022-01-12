<template>
  <div class="container">
    <div class="sidebar">
      <h2>Configuration</h2>
      <div class="flex chain">
        <label class="flex-20 fw-500" for="chain">Chain</label>
        <select class="flex-60 dropdown" name="chain" id="chain" v-model="form.chain" @change="onChainSelect">
          <option value="ethereum">Ethereum</option>
          <option value="binance">Binance</option>
          <!-- <option value="polygon">matic</option> -->
          <option value="solana">Solana</option>
        </select>
      </div>

      <div class="ui-mode">
        <div class="flex ui-mode">
          <span class="flex-20 fw-500">UI Mode</span>
          <span class="flex-60">
            <input type="radio" id="default" value="default" v-model="form.selectedUiMode" />
            <label for="default" class="mr-10">Default</label>
            <input type="radio" id="customUi" value="customUi" v-model="form.selectedUiMode" />
            <label for="customUi" class="mr-10">Custom UI</label>
            <input type="radio" id="whitelabel" value="whitelabel" v-model="form.selectedUiMode" />
            <label for="whitelabel">WhiteLabel</label>
          </span>
        </div>
        <br />

        <!-- UI MODE DEFAULT -->
        <div v-if="form.selectedUiMode == 'default'">
          <div class="flex">
            <span class="flex-20 fw-500">Login</span>
            <div class="flex-60">
              <li v-for="loginType in form.uiMode.default.login" :key="loginType.id" class="list-style-none">
                <label :for="loginType.id">
                  <input type="checkbox" v-model="loginType.checked" v-bind:id="loginType.id" />
                  <span>{{ loginType.name }}</span>
                </label>
              </li>
            </div>
          </div>
          <br />
          <div class="flex">
            <span class="flex-20 fw-500">Wallet</span>
            <div class="flex-60">
              <li v-for="walletType in form.uiMode.default.adapter" :key="walletType.id" class="list-style-none">
                <label :for="walletType.id">
                  <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" />
                  <span>{{ walletType.name }}</span>
                </label>
              </li>
            </div>
          </div>
        </div>

        <!-- UI MODE YOUR OWN MODAL -->
        <div v-if="form.selectedUiMode == 'customUi'">
          <div class="flex">
            <span class="flex-20 fw-500">Type</span>
            <span class="flex-60">
              <input type="radio" id="openlogin" name="openlogin" value="openlogin" v-model="form.uiMode.customUi.type" />
              <label for="openlogin">OpenLogin</label>
              <br />
              <input type="radio" id="customAuth" name="customAuth" value="customAuth" v-model="form.uiMode.customUi.type" />
              <label for="customauth">CustomAuth</label>
              <br />
            </span>
          </div>
          <br />
        </div>

        <!-- UI MODE WHITELABEL -->
        <div v-if="form.selectedUiMode == 'whitelabel'">
          <div class="flex">
            <span class="flex-20 fw-500">Logo URL</span>
            <span class="flex-60">
              <input type="text" class="text" v-model="form.uiMode.whitelabel.logoUrl" />
            </span>
          </div>
          <br />
          <div class="flex">
            <span class="flex-20 fw-500">theme</span>
            <span class="flex-60">
              <input type="radio" id="light" name="light" value="light" v-model="form.uiMode.whitelabel.theme" />
              <label for="light">Light</label>
              <br />
              <input type="radio" id="dark" name="dark" value="dark" v-model="form.uiMode.whitelabel.theme" />
              <label for="dark">Dark</label>
              <br />
            </span>
          </div>
        </div>
      </div>
      <div class="flex">
        <span class="flex-20" />
        <button class="btn flex-60" @click="saveConfig">Submit</button>
      </div>
    </div>
    <div class="content">
      <!-- <h2>DEMO: {{ config.chain }} x {{ config.selectedUiMode }}</h2> -->
      <section>
        <ConfigurableExample
          :adapterConfig="config.uiMode.default"
          :chain="config.chain"
          v-if="config.selectedUiMode === 'default'"
        ></ConfigurableExample>
        <CustomUiContainer :authType="config.uiMode.customUi.type" v-else-if="config.selectedUiMode === 'customUi'"></CustomUiContainer>
        <WhitelabelExample
          :uiConfig="config.uiMode.whitelabel"
          :chain="config.chain"
          v-else-if="config.selectedUiMode === 'whitelabel'"
        ></WhitelabelExample>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { CHAIN_NAMESPACES, ChainNamespaceType } from "@web3auth/base";
import { defaultEvmDappModalConfig, defaultSolanaDappModalConfig } from "@web3auth/web3auth";
import merge from "lodash.merge";
import Vue from "vue";

import CustomUiContainer from "./customUi/customUiContainer.vue";
import ConfigurableExample from "./default/configurableModal.vue";
import WhitelabelExample from "./whitelabel/whitelabel.vue";

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

const defaultConfig = {
  chain: "ethereum",
  selectedUiMode: "default",
  uiMode: {
    default: {
      login: defaultLoginProviders(),
      adapter: defaultAdapters(CHAIN_NAMESPACES.EIP155),
    },
    customUi: {
      type: "openlogin",
    },
    whitelabel: {
      logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg",
      theme: "light",
    },
  },
};
export default Vue.extend({
  name: "home",
  data() {
    return {
      // storing config collected from user input.
      form: { ...defaultConfig },
      // sending to other components
      config: { ...defaultConfig },
    };
  },
  components: {
    ConfigurableExample: ConfigurableExample,
    WhitelabelExample: WhitelabelExample,
    CustomUiContainer,
  },
  mounted() {
    const storedConfig = localStorage.getItem("web3AuthExampleConfig");
    const finalStoredConfig = JSON.parse(storedConfig || "{}");
    this.config = merge(this.config, finalStoredConfig);
    this.form = merge({}, this.config);
  },
  methods: {
    saveConfig: function () {
      localStorage.setItem("web3AuthExampleConfig", JSON.stringify(this.form || {}));
      this.config = merge({}, this.form);
    },
    onChainSelect: function (e) {
      console.log("e", e.target.value);
      this.form.uiMode.default.adapter =
        e.target.value === "solana" ? defaultAdapters(CHAIN_NAMESPACES.SOLANA) : defaultAdapters(CHAIN_NAMESPACES.EIP155);
    },
  },
});
</script>

<style>
body {
  margin: 0;
}

.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  min-width: 40%;
  border-right: 1px solid #ebecf0;
  background-color: #f4f5f7;
  height: 100%;
}

.content {
  width: 70%;
}

.flex {
  display: flex;
}

.flex-20 {
  flex-basis: 20%;
  text-align: right;
  margin-right: 20px;
}
.flex-60 {
  flex-basis: 60%;
  text-align: left;
}
.dropdown {
  width: 100%;
  font-size: 16px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  box-sizing: border-box;
}

.mr-10 {
  margin-right: 10px;
}
.fw-500 {
  font-weight: 500;
}
.btn {
  padding: 9px 16px;
  max-height: 40px;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  min-width: 60%;
  margin-top: 10px;
  height: 40px;
  color: #0364ff;
  background-color: #fff;
  border: 1px solid #0364ff;
  box-sizing: border-box;
  border-radius: 6px;
}

.btn:hover {
  background-color: #f5f7fc;
  border-color: #005cbf;
}
.rpcBtn {
  padding: 9px 16px;
  max-height: 80px;
  max-width: 80px;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  min-width: 60%;
  margin-top: 10px;
  height: 40px;
  color: #0364ff;
  background-color: #fff;
  border: 1px solid #0364ff;
  box-sizing: border-box;
  border-radius: 6px;
}

.rpcBtn:hover {
  background-color: #f5f7fc;
  border-color: #005cbf;
}

.btn:focus {
  box-shadow: 0 0 0 0.2rem rgb(0 123 255 / 50%);
}

.ui-mode {
  padding: 20px 0;
}

.chain {
  padding: 20px 0;
}

.text {
  width: 100%;
  font-size: 16px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  box-sizing: border-box;
}

.list-style-none {
  list-style: none;
}
</style>
