<template>
  <div id="app">
    <h2>Login with Web3Auth and Polygon</h2>
    <Loader :is-loading="loading"></Loader>

    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!provider" type="button" class="rpcBtn" style="cursor: pointer" @click="connect">Connect</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="logout">Logout</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="getUserInfo">Get User Info</button>
      <EthRpc v-if="provider" :connected-adapter="web3auth.connectedAdapterName" :provider="provider" :ui-console="uiConsole"></EthRpc>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, log, LoginMethodConfig } from "@web3auth/base";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { defineComponent } from "vue";

import Loader from "../components/loader.vue";
import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const polygonAmoyConfig: any = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13882", // hex of 80002, polygon testnet
  rpcTarget: "https://rpc.ankr.com/polygon_amoy",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Polygon Amoy Testnet",
  blockExplorerUrl: "https://amoy.polygonscan.com/",
  logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  ticker: "POL",
  tickerName: "Polygon Ecosystem Token",
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
  chainConfig: polygonAmoyConfig,
  clientId: config.clientId.testnet,
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: polygonAmoyConfig } }),
  enableLogging: true,
};

const ethWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: ethereumChainConfig,
  clientId: config.clientId.mainnet,
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: ethereumChainConfig } }),
  enableLogging: true,
};

export default defineComponent({
  name: "PolygonChain",
  components: {
    Loader,
    EthRpc,
  },
  props: {
    plugins: {
      type: Object,
      default: () => ({}),
    },
    adapterConfig: {
      type: Object,
      default: () => ({}),
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
      web3auth: new Web3Auth(ethWeb3AuthOptions),
    };
  },
  watch: {
    async adapterConfig() {
      // watch it
      await this.initPolygonWeb3Auth();
    },
    async openloginNetwork() {
      // watch it
      await this.initPolygonWeb3Auth();
    },
  },
  async mounted() {
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
        if (this.plugins.walletServices) {
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
        log.error("error", error);
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
        log.error("error", error);
        this.uiConsole("errored", error);
        this.loginButtonStatus = "";
      });
    },
    async connect() {
      try {
        const provider = await this.web3auth.connect();
        this.provider = provider;
      } catch (error) {
        log.error(error);
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
