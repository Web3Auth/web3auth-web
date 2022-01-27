<template>
  <div class="container">
    <div class="sidebar">
      <h2>Demo Settings</h2>
      <div class="flex chain">
        <label class="form-label" for="chain">Chain</label>
        <select class="form-control dropdown" name="chain" id="chain" v-model="form.chain" @change="onChainSelect">
          <option value="ethereum">Ethereum</option>
          <option value="binance">Binance</option>
          <!-- <option value="polygon">matic</option> -->
          <option value="solana">Solana</option>
        </select>
      </div>

      <div class="ui-mode">
        <div class="flex ui-mode">
          <span class="form-label">UI Mode</span>
          <span class="form-control radio-group">
            <label for="default" class="radio-button">
              <input type="radio" id="default" value="default" v-model="form.selectedUiMode" />
              Default
            </label>
            <label for="customUi" class="radio-button">
              <input type="radio" id="customUi" value="customUi" v-model="form.selectedUiMode" />
              CustomUI
            </label>
            <label for="whitelabel" class="radio-button">
              <input type="radio" id="whitelabel" value="whitelabel" v-model="form.selectedUiMode" />
              WhiteLabel
            </label>
          </span>
        </div>
        <br />

        <!-- UI MODE DEFAULT -->
        <div v-if="form.selectedUiMode == 'default'">
          <div class="ui-mode">
            <div class="flex ui-mode">
              <span class="form-label">Openlogin Network</span>
              <span class="form-control radio-group">
                <label for="mainnet" class="radio-button">
                  <input type="radio" id="mainnet" value="mainnet" v-model="form.openloginNetwork" />
                  Mainnet
                </label>
                <label for="testnet" class="radio-button">
                  <input type="radio" id="testnet" value="testnet" v-model="form.openloginNetwork" />
                  Testnet
                </label>
                <label for="cyan" class="radio-button">
                  <input type="radio" id="cyan" value="cyan" v-model="form.openloginNetwork" />
                  Cyan
                </label>
              </span>
            </div>
            <br />
          </div>
          <div class="flex">
            <span class="form-label">Login</span>
            <div class="form-control">
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
            <span class="form-label">Wallet</span>
            <div class="form-control">
              <li v-for="walletType in form.uiMode.default.adapter" :key="walletType.id" class="list-style-none">
                <label :for="walletType.id">
                  <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" />
                  <span>{{ walletType.name }}</span>
                </label>
              </li>
            </div>
          </div>
          <br />
        </div>

        <!-- UI MODE YOUR OWN MODAL -->
        <div v-if="form.selectedUiMode == 'customUi'">
          <div class="flex">
            <span class="form-label">Type</span>
            <span class="form-control">
              <input type="radio" id="openlogin" name="openlogin" value="openlogin" v-model="form.uiMode.customUi.type" />
              <label for="openlogin">OpenLogin</label>
              <br />
              <input type="radio" id="customAuth" name="customAuth" value="customAuth" v-model="form.uiMode.customUi.type" />
              <label for="customAuth">CustomAuth</label>
              <br />
              <input type="radio" id="walletConnect" name="walletConnect" value="walletConnect" v-model="form.uiMode.customUi.type" />
              <label for="customAuth">Wallet Connect</label>
              <br />
            </span>
          </div>
          <br />
        </div>

        <!-- UI MODE WHITELABEL -->
        <div v-if="form.selectedUiMode == 'whitelabel'">
          <div class="flex">
            <span class="form-label">Logo URL</span>
            <span class="form-control">
              <input type="text" class="text" v-model="form.uiMode.whitelabel.logoUrl" />
            </span>
          </div>
          <br />
          <div class="flex">
            <span class="form-label">Theme</span>
            <span class="form-control">
              <input type="radio" id="light" name="light" value="light" v-model="form.uiMode.whitelabel.theme" />
              <label for="light">Light</label>
              <br />
              <input type="radio" id="dark" name="dark" value="dark" v-model="form.uiMode.whitelabel.theme" />
              <label for="dark">Dark</label>
              <br />
            </span>
          </div>
          <br />
          <div class="order-container">
            <div class="form-label">
              <div>Login Methods Order</div>
              <a @click="setDefaultLoginMethodsOrder">Set to default</a>
            </div>
            <div>
              <textarea rows="5" class="order-list" v-model="tempLoginMethodsOrder" />
            </div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn" @click="saveConfig">Submit</button>
      </div>
    </div>
    <div class="content">
      <!-- <h2>DEMO: {{ config.chain }} x {{ config.selectedUiMode }}</h2> -->
      <section>
        <ConfigurableExample
          :openloginNetwork="config.openloginNetwork"
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

const defaultFormConfig = {
  chain: "ethereum",
  selectedUiMode: "default",
  openloginNetwork: "testnet",
  uiMode: {
    default: {
      login: [...defaultLoginProviders()],
      adapter: defaultAdapters(CHAIN_NAMESPACES.EIP155),
    },
    customUi: {
      type: "openlogin",
    },
    whitelabel: {
      logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg",
      theme: "light",
      loginMethodsOrder: DEFAULT_LOGIN_PROVIDERS,
    },
  },
};

const defaultComponentConfig = {
  chain: "ethereum",
  selectedUiMode: "default",
  openloginNetwork: "testnet",
  uiMode: {
    default: {
      login: [...defaultLoginProviders()],
      adapter: defaultAdapters(CHAIN_NAMESPACES.EIP155),
    },
    customUi: {
      type: "openlogin",
    },
    whitelabel: {
      logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg",
      theme: "light",
      loginMethodsOrder: DEFAULT_LOGIN_PROVIDERS,
    },
  },
};
export default Vue.extend({
  name: "home",
  data() {
    return {
      // storing config collected from user input.
      form: { ...defaultFormConfig },
      // sending to other components
      config: { ...defaultComponentConfig },
      tempLoginMethodsOrder: "",
    };
  },
  components: {
    ConfigurableExample: ConfigurableExample,
    WhitelabelExample: WhitelabelExample,
    CustomUiContainer,
  },
  mounted() {
    const storedConfig = sessionStorage.getItem("web3AuthExampleConfig");
    const finalStoredConfig = JSON.parse(storedConfig || "{}");
    this.config = merge(this.config, finalStoredConfig);
    if (finalStoredConfig.uiMode) this.config.uiMode.whitelabel.loginMethodsOrder = finalStoredConfig.uiMode.whitelabel.loginMethodsOrder;
    this.form = merge({}, this.config);
    // this.config.uiMode.default.login.push({
    //   id: "facebook",
    //   name: "Facebook",
    //   checked: false,
    // });
  },
  methods: {
    saveConfig: function () {
      this.form.uiMode.whitelabel.loginMethodsOrder = this.tempLoginMethodsOrder.split(",") as typeof DEFAULT_LOGIN_PROVIDERS;
      sessionStorage.setItem("web3AuthExampleConfig", JSON.stringify(this.form || {}));
      this.config = merge({}, this.form);
      console.log("config saved", this.config);
      // // temp hack to hide fb, todo: fix later
      // this.config.uiMode.default.login.push({
      //   id: "facebook",
      //   name: "Facebook",
      //   checked: false,
      // });
    },
    onChainSelect: function (e) {
      console.log("e", e.target.value);
      this.form.uiMode.default.adapter =
        e.target.value === "solana" ? defaultAdapters(CHAIN_NAMESPACES.SOLANA) : defaultAdapters(CHAIN_NAMESPACES.EIP155);
    },
    setDefaultLoginMethodsOrder: function () {
      this.tempLoginMethodsOrder = DEFAULT_LOGIN_PROVIDERS.join(",");
    },
  },
});
</script>

<style>
html,
body {
  margin: 0;
  height: 100%;
}

#app {
  height: 100%;
}

.container {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  height: 100%;
}

.sidebar {
  flex-grow: 1;
  flex-basis: 25rem;
  border-right: 1px solid #ebecf0;
  background-color: #f4f5f7;
  padding: 20px;
}

.content {
  flex-basis: 0;
  flex-grow: 999;
  min-width: 40%;
  padding: 20px;
}

.flex {
  display: flex;
}

.form-label {
  flex-basis: 5rem;
  text-align: right;
  margin-right: 10px;
  font-weight: 500;
}

.form-control {
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

.radio-group {
  flex-basis: 70%;
  flex-grow: 1;
}

.radio-button {
  display: inline-block;
  margin-right: 10px;
}
.radio-button:last-child {
  margin-right: 0;
}

.btn-group {
  text-align: center;
}

.btn {
  padding: 9px 16px;
  max-height: 40px;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  min-width: 70%;
  margin: 30px 0 10px;
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

.chain {
  margin-bottom: 20px;
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

.order-container {
  text-align: left;
}
.order-container .form-label {
  text-align: left;
  display: flex;
  width: 100%;
  padding: 0;
}
.order-container .form-label a {
  margin-left: auto;
  cursor: pointer;
  font-size: 12px;
  color: #0364ff;
  text-align: right;
}
.order-list {
  width: 100%;
}
</style>
