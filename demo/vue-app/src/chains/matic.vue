<template>
  <div id="app">
    <h2>Login with Web3Auth and Polygon</h2>
    <Loader :isLoading="loading"></Loader>

    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!provider" @click="connect" style="cursor: pointer">Connect</button>
      <button class="rpcBtn" v-if="provider" @click="logout" style="cursor: pointer">Logout</button>
      <button class="rpcBtn" v-if="provider" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <EthRpc :connectedAdapter="web3auth.connectedAdapterName" v-if="provider" :provider="provider" :uiConsole="uiConsole"></EthRpc>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, LoginMethodConfig } from "@web3auth/base";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { defineComponent } from "vue";

import Loader from "@/components/loader.vue";
import EthRpc from "@/rpc/ethRpc.vue";

import config from "../config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const polygonMumbaiConfig: any = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  rpcTarget: "https://rpc-mumbai.maticvigil.com",
  blockExplorerUrl: "https://mumbai-explorer.matic.today",
  logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  chainId: "0x13881",
  displayName: "Polygon Mumbai Testnet",
  ticker: "matic",
  tickerName: "matic",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ethereumChainConfig: any = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  rpcTarget: "https://rpc.ankr.com/eth",
  blockExplorerUrl: "https://etherscan.io",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  chainId: "0x1",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const polygonWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: polygonMumbaiConfig,
  clientId: config.clientId["testnet"],
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: polygonMumbaiConfig } }),
  enableLogging: true,
};

const ethWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: ethereumChainConfig,
  clientId: config.clientId["mainnet"],
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: ethereumChainConfig } }),
  enableLogging: true,
};

export default defineComponent({
  name: "PolygonChain",
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
  watch: {
    adapterConfig: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initPolygonWeb3Auth();
    },
    openloginNetwork: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initPolygonWeb3Auth();
    },
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
      provider: undefined,
      web3auth: new Web3Auth(ethWeb3AuthOptions),
    };
  },
  components: {
    Loader,
    EthRpc,
  },
  async mounted() {
    console.log("polygon");
    await this.initPolygonWeb3Auth();
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
    async initPolygonWeb3Auth() {
      console.log("polygon");
      this.parseConfig();
      try {
        this.loading = true;

        this.web3auth = new Web3Auth(polygonWeb3AuthOptions);
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId[this.openloginNetwork],
          },
        });

        this.web3auth.configureAdapter(openloginAdapter);
        if (this.plugins["walletServices"]) {
          const walletServicesPlugin = new WalletServicesPlugin({
            wsEmbedOpts: {},
            walletInitOptions: { whiteLabel: { showWidgetButton: true } },
          });
          await this.web3auth.addPlugin(walletServicesPlugin);
        }
        this.subscribeAuthEvents(this.web3auth);
        const adapters = await getDefaultExternalAdapters({ options: this.web3auth.options });
        adapters.forEach((adapter) => {
          this.web3auth.configureAdapter(adapter);
        });
        await this.web3auth.initModal({ modalConfig: this.modalConfig });
      } catch (error) {
        console.log("error", error);
        this.uiConsole("error", error);
      } finally {
        this.loading = false;
      }
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
        this.uiConsole("connected to wallet", data);
        this.provider = web3auth.provider;
        this.loginButtonStatus = "Logged in";
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.uiConsole("connecting");
        this.loginButtonStatus = "Connecting...";
      });
      web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
        this.uiConsole("disconnected");
        this.loginButtonStatus = "";
        this.provider = undefined;
      });
      web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
        console.log("error", error);
        this.uiConsole("errored", error);
        this.loginButtonStatus = "";
      });
    },
    async connect() {
      try {
        const provider = await this.web3auth.connect();
        this.provider = provider;
      } catch (error) {
        console.error(error);
        this.uiConsole("error", error);
      }
    },

    async logout() {
      await this.web3auth.logout();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await this.web3auth.getUserInfo();
      this.uiConsole(userInfo);
    },
    uiConsole(...args: unknown[]): void {
      const el = document.querySelector("#console>p");
      if (el) {
        el.innerHTML = JSON.stringify(args || {}, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
      }
    },
  },
});
</script>
