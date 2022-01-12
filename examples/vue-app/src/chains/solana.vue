<template>
  <div id="app">
    <h3>Login With Web3Auth X Solana</h3>
    <Loader :isLoading="loading"></Loader>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!connected" @click="connect" style="cursor: pointer">{{ loginButtonStatus }} Connect</button>
      <button class="rpcBtn" v-if="connected" @click="logout" style="cursor: pointer">logout</button>
      <SolanaRpc v-if="connected && provider" :provider="provider" :console="console"></SolanaRpc>
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

import SolanaRpc from "../rpc/solanaRpc.vue";
const solanaChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  rpcTarget: "https://api.testnet.solana.com",
  blockExplorer: "https://explorer.solana.com?cluster=testnet",
  chainId: "0x2",
  displayName: "testnet",
  ticker: "SOL",
  tickerName: "solana",
};

export default Vue.extend({
  name: "SolanaChain",
  props: {
    adapterConfig: {
      type: Object,
    },
  },
  watch: {
    adapterConfig: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initSolanaAuth();
    },
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      web3auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.SOLANA }, clientId: config.clientId }),
    };
  },
  components: {
    SolanaRpc,
    Loader,
  },
  async mounted() {
    await this.initSolanaAuth();
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
    async initSolanaAuth() {
      try {
        this.parseConfig();

        this.loading = true;
        this.web3auth = new Web3Auth({ chainConfig: solanaChainConfig, clientId: config.clientId, authMode: "DAPP" });
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
