<template>
  <div class="container">
    <div class="sidebar">
      <a href="https://github.com/Web3Auth/Web3Auth/tree/master/demo/vue-app" target="blank">
        <img src="./assets/github-logo.png" alt="github-logo" width="30px" />
      </a>
      <h2>Demo Settings</h2>

      <div class="flex-vertical-center authMode">
        <!-- <label class="form-label" for="chain">Chain</label> -->

        <span class="form-label">Auth Mode</span>
        <span class="form-control radio-group">
          <label for="hosted" class="radio-button">
            <input id="hosted" v-model="form.authMode" type="radio" value="hosted" />
            Hosted
          </label>
          <label for="ownAuth" class="radio-button">
            <input id="ownAuth" v-model="form.authMode" type="radio" value="ownAuth" />
            Use Your Own Auth
          </label>
        </span>
      </div>
      <div class="flex-vertical-center plugins">
        <!-- <label class="form-label" for="chain">Chain</label> -->

        <span class="form-label">Plugins</span>
        <span class="form-control radio-group">
          <label for="torusWallet" class="radio-button">
            <input id="torusWallet" v-model="form.plugins.torusWallet" type="checkbox" value="torus wallet plugin" />
            Torus Wallet UI Plugin
          </label>
        </span>
        <span class="form-control radio-group">
          <label for="walletServices" class="radio-button">
            <input id="walletServices" v-model="form.plugins.walletServices" type="checkbox" value="wallet services plugin" />
            Wallet Services Plugin
          </label>
        </span>
      </div>

      <hr />

      <div v-if="config.authMode === 'hosted'" class="hosted">
        <div class="ui-mode">
          <div class="flex-vertical-center ui-mode">
            <span class="form-label">Openlogin Network</span>
            <span class="form-control radio-group">
              <label for="sapphire_mainnet" class="radio-button">
                <input type="radio" id="sapphire_mainnet" value="sapphire_mainnet" v-model="form.openloginNetwork" />
                Sapphire Mainnet
              </label>
              <label for="sapphire_devnet" class="radio-button">
                <input type="radio" id="sapphire_devnet" value="sapphire_devnet" v-model="form.openloginNetwork" />
                Sapphire Devnet
              </label>
              <label for="mainnet" class="radio-button">
                <input id="mainnet" v-model="form.openloginNetwork" type="radio" value="mainnet" />
                Mainnet
              </label>
              <label for="testnet" class="radio-button">
                <input id="testnet" v-model="form.openloginNetwork" type="radio" value="testnet" />
                Testnet
              </label>
              <label for="cyan" class="radio-button">
                <input id="cyan" v-model="form.openloginNetwork" type="radio" value="cyan" />
                Cyan
              </label>
            </span>
          </div>
          <br />
        </div>
        <hr />
        <div class="flex-vertical-center chain">
          <!-- <label class="form-label" for="chain">Chain</label> -->

          <span class="form-label">Select Chain</span>
          <span class="form-control radio-group">
            <label for="ethereum" class="radio-button">
              <input id="ethereum" v-model="form.chain" type="radio" value="ethereum" />
              Ethereum
            </label>
            <label for="solana" class="radio-button">
              <input id="solana" v-model="form.chain" type="radio" value="solana" />
              Solana
            </label>
            <label for="binance" class="radio-button">
              <input id="binance" v-model="form.chain" type="radio" value="binance" />
              Binance
            </label>
            <label for="polygon" class="radio-button">
              <input id="polygon" v-model="form.chain" type="radio" value="polygon" />
              Polygon
            </label>
          </span>
        </div>
        <hr />
        <div class="ui-mode">
          <div class="flex-vertical-center ui-mode">
            <span class="form-label">UI</span>
            <span class="form-control radio-group">
              <label for="default" class="radio-button">
                <input id="default" v-model="form.selectedUiMode" type="radio" value="default" />
                Default
              </label>
              <!-- <label for="customUi" class="radio-button">
              <input type="radio" id="customUi" value="customUi" v-model="form.selectedUiMode" />
              CustomUI
            </label> -->
              <label for="whitelabel" class="radio-button">
                <input id="whitelabel" v-model="form.selectedUiMode" type="radio" value="whitelabel" />
                WhiteLabel
              </label>
            </span>
          </div>
          <hr />

          <!-- UI MODE DEFAULT -->
          <div v-if="form.selectedUiMode === 'default'">
            <div class="flex-vertical-center">
              <span class="form-label">Social Logins</span>
              <div class="form-control">
                <li v-for="loginType in form.uiMode.default.login" :key="loginType.id" class="list-style-none">
                  <label :for="loginType.id">
                    <input :id="loginType.id" v-model="loginType.checked" type="checkbox" />
                    <span>{{ loginType.name }}</span>
                  </label>
                </li>
              </div>
            </div>
            <hr />
            <div class="flex-vertical-center">
              <span class="form-label">External Wallets</span>
              <div class="form-control">
                <li v-for="walletType in form.uiMode.default.adapter" :key="walletType.id" class="list-style-none">
                  <label :for="walletType.id">
                    <input :id="walletType.id" v-model="walletType.checked" type="checkbox" />
                    <span>{{ walletType.name }}</span>
                  </label>
                </li>
              </div>
            </div>
          </div>

          <!-- UI MODE YOUR OWN MODAL -->
          <div v-if="form.selectedUiMode === 'customUi'">
            <div class="flex-vertical-center">
              <span class="form-label">Type</span>
              <span class="form-control">
                <input id="openlogin" v-model="form.uiMode.customUi.type" type="radio" name="openlogin" value="openlogin" />
                <label for="openlogin">OpenLogin</label>
                <br />
              </span>
            </div>
            <br />
          </div>

          <!-- UI MODE WHITELABEL -->
          <div v-if="form.selectedUiMode === 'whitelabel'">
            <div class="flex-vertical-center">
              <span class="form-label">Logo URL</span>
              <span class="form-control">
                <input v-model="form.uiMode.whitelabel.logoUrl" type="text" class="text" aria-label="logo" />
              </span>
            </div>
            <div class="flex-vertical-center">
              <span class="form-label">Theme</span>
              <span class="form-control">
                <input id="light" v-model="form.uiMode.whitelabel.theme" type="radio" name="light" value="light" />
                <label for="light">Light</label>
                <input id="dark" v-model="form.uiMode.whitelabel.theme" type="radio" name="dark" value="dark" />
                <label for="dark">Dark</label>
                <input id="auto" v-model="form.uiMode.whitelabel.theme" type="radio" name="auto" value="auto" />
                <label for="auto">Auto</label>
              </span>
            </div>
            <div class="flex-vertical-center">
              <label for="defaultLanguage" class="form-label">Default Language</label>
              <span class="form-control">
                <select id="defaultLanguage" v-model="form.uiMode.whitelabel.defaultLanguage">
                  <option v-for="language in languages" :key="language.value" :value="language.value">
                    {{ language.display }}
                  </option>
                </select>
              </span>
            </div>
            <div class="order-container">
              <div class="form-label">
                <div>Login Methods Order</div>
                <a @click="setDefaultLoginMethodsOrder" @keydown="setDefaultLoginMethodsOrder">Set to default</a>
              </div>
              <div>
                <textarea v-model="tempLoginMethodsOrder" aria-label="login-order" rows="5" class="order-list" />
              </div>
              <div></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="config.authMode === 'ownAuth'" class="ownAuth">
        <!-- <CustomUiContainer :authType="config.uiMode.customUi.type" v-if="config.authMode === 'ownAuth'"></CustomUiContainer> -->
      </div>

      <div class="btn-group">
        <button type="button" class="btn submit-btn" @click="saveConfig">Submit</button>
      </div>
    </div>
    <div class="content">
      <section>
        <!-- hosted auth -->
        <ConfigurableExample
          v-if="config.selectedUiMode === 'default' && config.authMode === 'hosted'"
          :plugins="form.plugins"
          :openlogin-network="config.openloginNetwork"
          :adapter-config="config.uiMode.default"
          :chain="config.chain"
        />

        <WhitelabelExample
          v-else-if="config.selectedUiMode === 'whitelabel' && config.authMode === 'hosted'"
          :ui-config="config.uiMode.whitelabel"
          :chain="config.chain"
        />

        <!-- Custom auth -->
        <CustomUiContainer v-if="config.authMode === 'ownAuth'" :auth-type="config.uiMode.customUi.type"></CustomUiContainer>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin-utils";
import { CHAIN_NAMESPACES, ChainNamespaceType, log } from "@web3auth/base";
import { defaultEvmDappModalConfig, defaultSolanaDappModalConfig } from "@web3auth/modal";
import { cloneDeep } from "lodash";
import merge from "lodash.merge";
import { defineComponent } from "vue";

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
  openloginNetwork: "sapphire_mainnet",
  plugins: {
    torusWallet: false,
    walletServices: true,
  },
  uiMode: {
    default: {
      login: [...defaultLoginProviders()],
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
  const whitelabelParams = params.get("whitelabel");

  // prettier-ignore
  return {
    ...(["ethereum", "solana", "binance", "polygon"].includes(chainParams)  && { chain: chainParams }),
    ...(authModeParams === "custom"                                         && { authMode: "ownAuth" }),
    ...(whitelabelParams === "yes"                                          && { selectedUiMode: "whitelabel" }),
  };
};

const initialFormConfig = {
  ...defaultFormConfig,
  ...configFromSessionStorage(),
  ...configFromURL(),
};

log.info(initialFormConfig);

export default defineComponent({
  name: "HomeComponent",
  components: {
    CustomUiContainer,
    ConfigurableExample,
    WhitelabelExample,
  },
  data() {
    return {
      // storing config collected from user input.
      form: { ...initialFormConfig },
      // sending to other components
      config: { ...cloneDeep(initialFormConfig) },
      tempLoginMethodsOrder: initialFormConfig.uiMode?.whitelabel.loginMethodsOrder.join(",") ?? "",
      languages: [
        {
          value: "en",
          display: "English",
        },
        {
          value: "de",
          display: "German",
        },
        {
          value: "ja",
          display: "Japanese",
        },
        {
          value: "ko",
          display: "Korean",
        },
        {
          value: "zh",
          display: "Mandarin",
        },
        {
          value: "es",
          display: "Spanish",
        },
        {
          value: "fr",
          display: "French",
        },
        {
          value: "pt",
          display: "Portuguese",
        },
        {
          value: "nl",
          display: "Dutch",
        },
      ],
    };
  },
  watch: {
    "form.authMode": function (val) {
      const formValURLSearchParamMap = { ownAuth: "custom", hosted: "default" };
      this.updateURL("auth", formValURLSearchParamMap[val]);
    },
    "form.chain": function (val) {
      this.updateURL("chain", val);
    },
    "form.selectedUiMode": function (val) {
      const formValURLSearchParamMap = { whitelabel: "yes", default: "no" };
      this.updateURL("whitelabel", formValURLSearchParamMap[val]);
    },
  },
  methods: {
    saveConfig() {
      this.form.uiMode.whitelabel.loginMethodsOrder = this.tempLoginMethodsOrder.split(",") as typeof DEFAULT_LOGIN_PROVIDERS;
      sessionStorage.setItem("web3AuthExampleConfig", JSON.stringify(this.form || {}));
      this.config = merge({}, this.form);
      log.info("config saved", this.config);
      // // temp hack to hide fb, todo: fix later
      // this.config.uiMode.default.login.push({
      //   id: "facebook",
      //   name: "Facebook",
      //   checked: false,
      // });
    },
    onChainSelect(e) {
      log.info("e", e.target.value);
      this.form.uiMode.default.adapter =
        e.target.value === "solana" ? defaultAdapters(CHAIN_NAMESPACES.SOLANA) : defaultAdapters(CHAIN_NAMESPACES.EIP155);
    },
    setDefaultLoginMethodsOrder() {
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
  padding-bottom: 60px;
}

.content {
  flex-basis: 0;
  flex-grow: 999;
  min-width: 30%;
  padding: 20px;
}

.flex-vertical-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 20px;
}

.form-label {
  flex-basis: 2rem;
  text-align: right;
  margin-right: 10px;
  font-weight: 800;
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
  position: fixed;
  bottom: 0;
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
  border: 3px solid #0364ff;
  box-sizing: border-box;
  border-radius: 6px;
}
.submit-btn {
  width: 400px;
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
