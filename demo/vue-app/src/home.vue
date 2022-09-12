<template>
  <div class="container gap-7">
    <div class="sidebar box grid grid-rows-12">
      <header class="row-span-1 p-6">
        <img src="./assets/web3auth.png" class="w3a-image" />
      </header>
      <!-- <a href="https://github.com/Web3Auth/Web3Auth/tree/master/examples/vue-app" target="blank">link</a> -->
      <!-- <h2>Demo Settings</h2> -->
      <div class="row-span-10 overflow-auto">
        <!-- <div class="flex-vertical-center authMode"> -->
        <!-- <label class="form-label" for="chain">Chain</label> -->
        <div class="p-2 text-left">
          <h3 class="font-semibold text-[#595857]">Auth Mode</h3>
          <select name="buildEnv" v-model="form.authMode" class="select-menu bg-dropdown">
            <option value="hosted">Hosted</option>
            <option value="ownAuth">Use Your Own Auth</option>
            <!-- <option value="development">Development</option> -->
          </select>
        </div>
        <!-- 
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
          </span> -->
        <!-- </div> -->
        <div class="plugins text-left py-2">
          <!-- <label class="form-label" for="chain">Chain</label> -->

          <!-- <span class="form-label">Plugins</span> -->
          <span class="form-control radio-group text-left p-2">
            <label for="torusWallet" class="radio-button">
              <input type="checkbox" id="torusWallet" value="torus wallet plugin" v-model="form.plugins.torusWallet" />
              Torus Wallet UI Plugin
            </label>
          </span>
        </div>

        <div class="hosted" v-if="config.authMode === 'hosted'">
          <div class="p-2 text-left">
            <h3 class="font-semibold text-[#595857]">Openlogin network</h3>
            <select name="Network" v-model="form.openloginNetwork" class="select-menu bg-dropdown">
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
              <option value="cyan">Cyan</option>
              <!-- <option value="development">Development</option> -->
            </select>
            <!-- <div class="flex-vertical-center ui-mode">
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
            <br /> -->
          </div>
          <!-- <hr /> -->
          <div class="chain">
            <!-- <label class="form-label" for="chain">Chain</label> -->
            <div class="p-2 text-left">
              <h3 class="font-semibold text-[#595857]">Select Chain</h3>
              <select name="chainConfig" v-model="form.chain" class="select-menu bg-dropdown">
                <option value="ethereum">Ethereum</option>
                <option value="solana">Solana</option>
                <option value="binance">Binance</option>
                <option value="polygon">Polygon</option>
                <!-- <option value="development">Development</option> -->
              </select>
            </div>
            <!-- <span class="form-label">Select Chain</span>
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
            </span> -->
          </div>
          <div class="ui-mode">
            <!-- <div class="flex-vertical-center ui-mode">
              <span class="form-label">UI</span>
              <span class="form-control radio-group">
                <label for="default" class="radio-button">
                  <input type="radio" id="default" value="default" v-model="form.selectedUiMode" />
                  Default
                </label>
              
                <label for="whitelabel" class="radio-button">
                  <input type="radio" id="whitelabel" value="whitelabel" v-model="form.selectedUiMode" />
                  WhiteLabel
                </label>
              </span>
            </div> -->
            <div class="p-2 text-left">
              <h3 class="font-semibold text-[#595857]">Select UI</h3>
              <select name="uiMode" v-model="form.selectedUiMode" class="select-menu bg-dropdown">
                <option value="default">Default</option>
                <option value="whitelabel">WhiteLabel</option>
                <!-- <option value="development">Development</option> -->
              </select>
            </div>

            <!-- UI MODE DEFAULT -->
            <div v-if="form.selectedUiMode == 'default'">
              <div class="text-left p-[10px]">
                <!-- <h3 class="form-label font-semibold text-[#595857]">Select UI</h3> -->
                <span class="form-label text-[#595857]">Social Logins</span>
                <div class="grid grid-cols-2 pl-4 text-center gap-2 form-control">
                  <!-- <li v-for="loginType in form.uiMode.default.login" :key="loginType.id" class="list-style-none">
                    <label :for="loginType.id">
                      <input type="checkbox" v-model="loginType.checked" v-bind:id="loginType.id" />
                      <img :src="getImgUrl(loginType.id)" height="7px" />
                      <span>{{ loginType.name }}</span>
                    </label>
                  </li> -->
                  <div class="form-check inline-flex col-span-1" v-for="loginType in form.uiMode.default.login" :key="loginType.id">
                    <input type="checkbox" v-model="loginType.checked" v-bind:id="loginType.id" />
                    <img v-if="loginType.id !== 'email_passwordless'" :src="getImgUrl(loginType.id)" class="h-[22px] inline-block px-2" />
                    <img v-else :src="getImgUrl('email')" class="h-[20px] inline-block px-2" />
                    <label class="form-check-label inline-block text-gray-800" :for="loginType.id">
                      <span v-if="loginType.id !== 'email_passwordless'" class="text-base">{{ loginType.name }}</span>
                      <span v-else>Email</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="text-left p-[10px]">
                <span class="form-label text-[#595857]">External Wallets</span>
                <div class="text-center form-control">
                  <!-- <li v-for="walletType in form.uiMode.default.adapter" :key="walletType.id" class="list-style-none">
                    <label :for="walletType.id">
                      <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" />
                      <span>{{ walletType.name }}</span>
                    </label>
                  </li> -->
                  <div
                    class="form-check inline-flex col-span-1 pl-4 pr-2 px-4 py-2 rounded-full text-gray-500 bg-gray-100 font-semibold text-sm flex align-center w-max cursor-pointer active:bg-gray-300 transition duration-300 ease m-1"
                    v-for="walletType in form.uiMode.default.adapter"
                    :key="walletType.id"
                  >
                    <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" />
                    <img :src="getImgUrl(walletType.id)" class="h-[22px] inline-block px-2" />
                    <label class="form-check-label inline-block text-gray-800" :for="walletType.id">
                      <span class="text-base">{{ walletType.name }}</span>
                    </label>
                  </div>
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
            <div v-if="form.selectedUiMode == 'whitelabel'" class="bg-[#F9F9FB] p-4 rounded-3xl">
              <div class="flex-vertical-center">
                <span class="form-label">Logo URL</span>
                <!-- <span class="form-control"> -->
                <input type="text" class="text p-2" v-model="form.uiMode.whitelabel.logoUrl" />
                <!-- </span> -->
              </div>
              <div class="p-2">
                <h3 class="font-semibold text-[#595857]">Theme</h3>
                <select name="uiMode" v-model="form.uiMode.whitelabel.theme" class="select-menu-whitelabel bg-dropdown">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <!-- <option value="development">Development</option> -->
                </select>
              </div>
              <!-- <br /> -->
              <!-- <div class="flex-vertical-center">
                <span class="form-label">Theme</span>
                <span class="form-control">
                  <input type="radio" id="light" name="light" value="light" v-model="form.uiMode.whitelabel.theme" />
                  <label for="light">Light</label>
                  <br />
                  <input type="radio" id="dark" name="dark" value="dark" v-model="form.uiMode.whitelabel.theme" />
                  <label for="dark">Dark</label>
                  <br />
                </span>
              </div> -->
              <!-- <br /> -->
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
      </div>
      <div class="row-span-1">
        <div class="btn-group">
          <button class="submit-btn" @click="saveConfig">Submit</button>
        </div>
      </div>
    </div>
    <div class="content" id="content">
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
    ConfigurableExample: ConfigurableExample,
    WhitelabelExample: WhitelabelExample,
    CustomUiContainer,
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
    getImgUrl(id: string) {
      console.log(id);
      if (id === "wallet-connect-v1") id = "wallet-connect";
      return "https://images.web3auth.io/login-" + id + ".svg";
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
  @apply grid grid-cols-6 h-[100vh];
  /* display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  height: 100%;
  background-color: #e3e3e3; */
}

.sidebar {
  @apply col-span-6 sm:col-span-3 md:col-span-3 lg:col-span-2 max-h-[90vh] min-h-[90vh] p-2 md:p-8 m-8;
  /* flex-grow: 1;
  flex-basis: 25rem;
  border-right: 1px solid #ebecf0;
  background-color: #f4f5f7;
  padding: 20px;
  background: linear-gradient(0deg, #ffffff, #ffffff), #f3f3f4;
  border: 1px solid #f3f3f4;
  box-shadow: 4px 4px 20px rgba(46, 91, 255, 0.1);
  border-radius: 20px;
  margin: 20px;
  max-height: 95%;
  text-align: left;
  align-items: left;
  justify-content: left; */
}

.content {
  @apply col-span-6 sm:col-span-3 md:col-span-3 lg:col-span-4 flex h-screen justify-center items-center;
  /* flex-basis: 0;
  flex-grow: 999;
  min-width: 30%;
  padding: 20px; */
}

/* .flex-vertical-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 20px;
} */

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
  padding: 1rem;
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
  @apply w-[80%] rounded-3xl bg-[#0364FF] text-[white] h-12 bottom-0;
  /* width: 400px; */
}

.btn:hover {
  background-color: #f5f7fc;
  border-color: #005cbf;
}
/* .rpcBtn {
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
} */

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
  @apply min-h-[44px] w-[95%] m-0 bg-white rounded-3xl text-[#6F717A] text-sm lg:text-base font-medium;
  border: 1px solid #6f717a;
}

.list-style-none {
  list-style: none;
}

.order-container {
  text-align: left;
}
.order-container .form-label {
  @apply p-2 text-left flex;
}
.order-container .form-label a {
  margin-left: auto;
  cursor: pointer;
  font-size: 12px;
  color: #0364ff;
  text-align: right;
}
.order-list {
  @apply w-[95%] border-[1px] border-black rounded-2xl m-2 p-2;
}
.w3a-image {
  height: 48px;
}
.box {
  @apply bg-white;
  border: 1px solid #f3f3f4;
  border-radius: 20px;
  box-shadow: 4px 4px 20px rgba(46, 91, 255, 0.1);
}
.select-menu {
  @apply h-10 w-full rounded-3xl text-center bg-[#F9F9FB] bg-no-repeat;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-position: right 16px top 50%;
  background-size: 10px;
}
.select-menu-whitelabel {
  @apply h-10 w-80 rounded-3xl text-center bg-white bg-no-repeat;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-position: right 16px top 50%;
  background-size: 10px;
}
#content button {
  @apply min-h-[44px] max-w-[60%] min-w-[60%] m-0 bg-white rounded-3xl text-[#6F717A] text-sm lg:text-base font-medium mb-2;
  border: 1px solid #6f717a;
}
#content h2 {
  @apply mt-1 mb-4 text-3xl font-bold;
}
/* #content #console {
  @apply overflow-auto min-h-[150px] rounded-3xl relative p-4 w-[20%];
} */
</style>
