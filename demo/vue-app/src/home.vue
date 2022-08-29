<template>
  <div class="container">
    <div class="sidebar">
      <a href="https://github.com/Web3Auth/Web3Auth/tree/master/demo/vue-app" target="blank">
        <img src="./assets/github-logo.png" width="30px" />
      </a>
      <h2>Demo Settings</h2>

      <div class="flex-vertical-center authMode">
        <!-- <label class="form-label" for="chain">Chain</label> -->

        <span class="form-label">Auth Mode</span>
        <span class="form-control radio-group">
          <label for="hosted" class="radio-button">
            <input type="radio" id="hosted" value="hosted" v-model="form.authMode" />
            Hosted
          </label>
          <label for="ownAuth" class="radio-button">
            <input type="radio" id="ownAuth" value="ownAuth" v-model="form.authMode" />
            Use Your Own Auth
          </label>
        </span>
      </div>
      <div class="flex-vertical-center plugins">
        <!-- <label class="form-label" for="chain">Chain</label> -->

        <span class="form-label">Plugins</span>
        <span class="form-control radio-group">
          <label for="torusWallet" class="radio-button">
            <input type="checkbox" id="torusWallet" value="torus wallet plugin" v-model="form.plugins.torusWallet" />
            Torus Wallet UI Plugin
          </label>
        </span>
      </div>

      <hr />

      <div class="hosted" v-if="config.authMode === 'hosted'">
        <div class="ui-mode">
          <div class="flex-vertical-center ui-mode">
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
        <hr />
        <div class="flex-vertical-center chain">
          <!-- <label class="form-label" for="chain">Chain</label> -->

          <span class="form-label">Select Chain</span>
          <span class="form-control radio-group">
            <label for="ethereum" class="radio-button">
              <input type="radio" id="ethereum" value="ethereum" v-model="form.chain" />
              Ethereum
            </label>
            <label for="solana" class="radio-button">
              <input type="radio" id="solana" value="solana" v-model="form.chain" />
              Solana
            </label>
            <label for="binance" class="radio-button">
              <input type="radio" id="binance" value="binance" v-model="form.chain" />
              Binance
            </label>
            <label for="polygon" class="radio-button">
              <input type="radio" id="polygon" value="polygon" v-model="form.chain" />
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
                <input type="radio" id="default" value="default" v-model="form.selectedUiMode" />
                Default
              </label>
              <!-- <label for="customUi" class="radio-button">
              <input type="radio" id="customUi" value="customUi" v-model="form.selectedUiMode" />
              CustomUI
            </label> -->
              <label for="whitelabel" class="radio-button">
                <input type="radio" id="whitelabel" value="whitelabel" v-model="form.selectedUiMode" />
                WhiteLabel
              </label>
            </span>
          </div>
          <hr />

          <!-- UI MODE DEFAULT -->
          <div v-if="form.selectedUiMode == 'default'">
            <div class="flex-vertical-center">
              <span class="form-label">Social Logins</span>
              <div class="form-control">
                <li v-for="loginType in form.uiMode.default.login" :key="loginType.id" class="list-style-none">
                  <label :for="loginType.id">
                    <input type="checkbox" v-model="loginType.checked" v-bind:id="loginType.id" />
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
                    <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" />
                    <span>{{ walletType.name }}</span>
                  </label>
                </li>
              </div>
            </div>
          </div>

          <!-- UI MODE YOUR OWN MODAL -->
          <div v-if="form.selectedUiMode == 'customUi'">
            <div class="flex-vertical-center">
              <span class="form-label">Type</span>
              <span class="form-control">
                <input type="radio" id="openlogin" name="openlogin" value="openlogin" v-model="form.uiMode.customUi.type" />
                <label for="openlogin">OpenLogin</label>
                <br />
              </span>
            </div>
            <br />
          </div>

          <!-- UI MODE WHITELABEL -->
          <div v-if="form.selectedUiMode == 'whitelabel'">
            <div class="flex-vertical-center">
              <span class="form-label">Logo URL</span>
              <span class="form-control">
                <input type="text" class="text" v-model="form.uiMode.whitelabel.logoUrl" />
              </span>
            </div>
            <br />
            <div class="flex-vertical-center">
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
      </div>

      <div class="ownAuth" v-else-if="config.authMode === 'ownAuth'">
        <!-- <CustomUiContainer :authType="config.uiMode.customUi.type" v-if="config.authMode === 'ownAuth'"></CustomUiContainer> -->
      </div>

      <div class="btn-group">
        <button class="btn submit-btn" @click="saveConfig">Submit</button>
      </div>
    </div>
    <div class="content">
      <section>
        <!-- hosted auth -->
        <ConfigurableExample
          :plugins="config.plugins"
          :openloginNetwork="config.openloginNetwork"
          :adapterConfig="config.uiMode.default"
          :chain="config.chain"
          v-if="config.selectedUiMode === 'default' && config.authMode === 'hosted'"
        />

        <WhitelabelExample
          :uiConfig="config.uiMode.whitelabel"
          :chain="config.chain"
          v-else-if="config.selectedUiMode === 'whitelabel' && config.authMode === 'hosted'"
        />

        <!-- Custom auth -->
        <CustomUiContainer :authType="config.uiMode.customUi.type" v-if="config.authMode === 'ownAuth'"></CustomUiContainer>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { CHAIN_NAMESPACES, ChainNamespaceType, EVM_ADAPTERS } from "@web3auth/base";
import { defaultEvmDappModalConfig, defaultSolanaDappModalConfig } from "@web3auth/web3auth";
import { cloneDeep } from "lodash";
import merge from "lodash.merge";
import Vue from "vue";

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
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    adaptersConfig.adapters[EVM_ADAPTERS.COINBASE] = {
      label: "Coinbase",
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    };
  }
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

export default Vue.extend({
  name: "HomeComponent",
  data() {
    return {
      // storing config collected from user input.
      form: { ...initialFormConfig },
      // sending to other components
      config: { ...cloneDeep(initialFormConfig) },
      tempLoginMethodsOrder: initialFormConfig.uiMode?.whitelabel.loginMethodsOrder.join(",") ?? "",
    };
  },
  components: {
    ConfigurableExample: () => import("./default/configurableModal.vue"),
    WhitelabelExample: () => import("./whitelabel/whitelabel.vue"),
    CustomUiContainer: () => import("./customUi/customUiContainer.vue"),
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
