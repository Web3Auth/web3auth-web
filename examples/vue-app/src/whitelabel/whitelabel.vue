<template>
  <div id="app">
    <h2>Login with Web3Auth</h2>
    <h3>Connect with {{ web3auth.options.chainConfig.chainNamespace }} web3auth</h3>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <Loader :isLoading="loading" />
    </section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!provider" @click="connect" style="cursor: pointer">Connect</button>
      <button class="rpcBtn" v-if="provider" @click="logout" style="cursor: pointer">Logout</button>
      <button class="rpcBtn" v-if="provider" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <EthRpc v-if="provider && web3auth.options.chainConfig.chainNamespace === 'eip155'" :provider="provider" :console="console"></EthRpc>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA } from "@web3auth/base";
import { Web3Auth } from "@web3auth/web3auth";
import Vue from "vue";

import Loader from "../components/loader.vue";
import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

export default Vue.extend({
  name: "WhitelabelExample",
  props: {
    uiConfig: {
      type: Object,
      default: () => ({
        theme: "light",
        logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg",
      }),
    },
  },
  watch: {
    uiConfig: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initWhitelabledModal();
    },
  },
  data() {
    return {
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined,
      web3auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId }),
    };
  },
  components: {
    EthRpc,
    Loader,
  },
  async mounted() {
    await this.initWhitelabledModal();
  },
  methods: {
    async initWhitelabledModal() {
      try {
        this.loading = true;
        this.web3auth = new Web3Auth({
          uiConfig: { appLogo: this.uiConfig.logoUrl, theme: this.uiConfig.theme, loginMethodsOrder: this.uiConfig.loginMethodsOrder },
          chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
          clientId: config.clientId,
        });
        this.subscribeAuthEvents(this.web3auth);
        await (this.web3auth as Web3Auth).initModal({});
      } catch (error) {
        console.log("error", error);
        this.console("error sss", error);
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
    async connect() {
      try {
        this.provider = await this.web3auth.connect();
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
