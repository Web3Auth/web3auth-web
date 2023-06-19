<template>
  <div v-if="loading" class="flex flex-col items-center justify-center">
    <Loader useSpinner :size="80" />
  </div>
  <div v-else class="flex flex-col items-center justify-center">
    <h2 class="text-2xl font-bold text-app-gray-900">Login with Web3Auth and Binance Smart Chain</h2>
    <Button v-if="!provider" variant="secondary" @click="connect" class="connect-btn mt-4 w-[320px]" pill>Connect</Button>
    <div class="flex gap-4 items-center w-full mt-4">
      <Button v-if="provider" @click="logout" variant="secondary" pill block class="connect-btn">Logout</Button>
      <Button v-if="provider" @click="getUserInfo" variant="secondary" pill block class="connect-btn">Get User Info</Button>
    </div>
    <EthRpc :connectedAdapter="Web3Auth.connectedAdapterName" v-if="provider" :provider="provider" :console="console"></EthRpc>
    <div id="console" style="white-space: pre-line" class="mt-10 console-container bg-app-gray-200 shadow-md rounded-lg p-4">
      <p style="white-space: pre-line" class="text-xs font-normal break-words console-inner-container overflow-y-auto overflow-x-auto"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { Button, Loader } from "@toruslabs/vue-components";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig, LoginMethodConfig } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";
import { defineComponent } from "vue";

import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

const binanceChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  rpcTarget: "https://data-seed-prebsc-2-s3.binance.org:8545",
  blockExplorer: "https://testnet.bscscan.com",
  chainId: "0x61",
  displayName: "Binance SmartChain Testnet",
  ticker: "BNB",
  tickerName: "BNB",
};

let web3AuthInstance = null;

const getWeb3Auth = (openloginNetwork: string) => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3Auth({
      chainConfig: binanceChainConfig,
      clientId: config.clientId[openloginNetwork],
      authMode: "DAPP",
      enableLogging: true,
    });
  }
  return web3AuthInstance;
};

const logOutWeb3Auth = () => {
  if (web3AuthInstance) {
    web3AuthInstance.logout();
  }
};

export default defineComponent({
  name: "BinanceChain",
  props: {
    plugins: {
      type: Object,
      default: () => ({}),
    },
    adapterConfig: {
      type: Object,
    },
    openloginNetwork: {
      type: String,
      default: "testnet",
    },
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
      provider: undefined,
      Web3Auth: undefined,
    };
  },
  watch: {
    adapterConfig: async function (newSettings, oldSettings) {
      await this.initBinanceWeb3Auth();
    },
  },
  components: {
    EthRpc,
    Loader,
    Button,
  },
  async mounted() {
    await this.initBinanceWeb3Auth();
  },
  methods: {
    parseConfig() {
      this.adapterConfig.adapter.forEach((adapterConf) => {
        this.modalConfig[adapterConf.id] = {
          name: adapterConf.name,
          showOnModal: adapterConf.checked,
        };
        if (adapterConf.id === "openlogin") {
          const loginMethodsConfig: LoginMethodConfig = {};
          this.adapterConfig.login.forEach((loginProvider) => {
            loginMethodsConfig[loginProvider.id] = {
              name: loginProvider.name,
              showOnModal: loginProvider.checked,
            };
          });
          this.modalConfig[adapterConf.id] = {
            ...this.modalConfig[adapterConf.id],
            loginMethods: loginMethodsConfig,
          };
        }
      });
    },
    async initBinanceWeb3Auth() {
      try {
        this.parseConfig();
        this.loading = true;
        const web3auth = getWeb3Auth(this.openloginNetwork);
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId[this.openloginNetwork],
          },
        });
        web3auth.configureAdapter(openloginAdapter);
        if (this.plugins["torusWallet"]) {
          const torusPlugin = new TorusWalletConnectorPlugin({
            torusWalletOpts: {},
            walletInitOptions: {
              whiteLabel: {
                theme: { isDark: true, colors: { primary: "#00a8ff" } },
                logoDark: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
                logoLight: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
              },
              useWalletConnect: true,
              enableLogging: true,
            },
          });
          await web3auth.addPlugin(torusPlugin);
        }
        this.subscribeAuthEvents(web3auth);
        await web3auth.initModal({ modalConfig: this.modalConfig });
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      } finally {
        this.loading = false;
      }
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
        this.console("connected to wallet", data);
        this.provider = web3auth.provider;
        this.loginButtonStatus = "Logged in";
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.console("connecting");
        this.loginButtonStatus = "Connecting...";
      });
      web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
        this.console("disconnected");
        this.loginButtonStatus = "";
        this.provider = undefined;
      });
      web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
        console.log("error", error);
        this.console("errored", error);
        this.loginButtonStatus = "";
      });
    },
    async connect() {
      try {
        const web3authProvider = await getWeb3Auth(this.openloginNetwork);
        const webProvider = await web3authProvider.connect();
        this.Web3Auth = web3authProvider;
        this.provider = webProvider;
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },

    async logout() {
      await logOutWeb3Auth();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await getWeb3Auth(this.openloginNetwork).getUserInfo();
      this.console(userInfo);
    },
    console(...args: unknown[]): void {
      const el = document.querySelector("#console>p");
      if (el) {
        el.innerHTML = JSON.stringify(args || {}, null, 2);
      }
    },
  },
});
</script>

<style scoped>
.connect-btn {
  border-color: #6f717a !important;
  color: #6f717a !important;
}
.console-container {
  width: 500px;
  height: 350px;
}
.console-inner-container {
  width: 468px;
  height: 328px;
}
</style>
