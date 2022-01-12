<template>
  <div id="app">
    <h3>Login With Web3Auth X Polygon</h3>
    <Loader :isLoading="loading"></Loader>

    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!connected" @click="connect" style="cursor: pointer">{{ loginButtonStatus }} Connect</button>
      <button class="rpcBtn" v-if="connected" @click="logout" style="cursor: pointer">logout</button>
      <PolygonRpc v-if="connected && provider" :provider="provider" :console="console"></PolygonRpc>
      <button class="rpcBtn" v-if="connected" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig, LoginMethodConfig } from "@web3auth/base";
import { Web3Auth } from "@web3auth/web3auth";
import Vue from "vue";

import Loader from "@/components/loader.vue";

import config from "../config";
import PolygonRpc from "../rpc/polygonRpc.vue";
const polygonMumbaiConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  rpcTarget: "https://rpc-mumbai.maticvigil.com",
  blockExplorer: "https://mumbai-explorer.matic.today",
  chainId: "0x13881",
  displayName: "Polygon Mumbai Testnet",
  ticker: "matic",
  tickerName: "matic",
};

export default Vue.extend({
  name: "PolygonChain",
  props: {
    adapterConfig: {
      type: Object,
    },
  },
  watch: {
    adapterConfig: async function (newVal, oldVal) {
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
      connected: false,
      provider: undefined,
      web3auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId }),
    };
  },
  components: {
    PolygonRpc,
    Loader,
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
        if (adapterConf.id === "openlogin" || adapterConf.id==="customAuth") {
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

        this.web3auth = new Web3Auth({ chainConfig: polygonMumbaiConfig, clientId: config.clientId, authMode: "DAPP" });
        this.subscribeAuthEvents(this.web3auth);
        await this.web3auth.initModal({ modalConfig: this.modalConfig });
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
        this.connected = true;
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.console("connecting");
        this.loginButtonStatus = "Connecting...";
      });
      web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
        this.console("disconnected");
        this.loginButtonStatus = "";
        this.connected = false;
      });
      web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
        console.log("error", error);
        this.console("errored", error);
        this.loginButtonStatus = "";
      });
    },
    connect() {
      try {
        this.web3auth.connect();
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },

    async logout() {
      await this.web3auth.logout();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await this.web3auth.getUserInfo();
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
