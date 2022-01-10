<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    <h3>Connect with {{ web3auth.options.chainNamespace }} web3auth</h3>
    <!-- <div id="w3a-modal" class="w3a-modal" v-if="loading">
        <div class="w3ajs-modal-loader w3a-modal__loader">
          <div class="w3a-modal__loader-content">
              <div class="w3a-modal__loader-info">
                <div class="w3ajs-modal-loader__spinner w3a-spinner">
                    <div class="w3a-spinner__body"></div>
                    <div class="w3a-spinner__cover"></div>
                    <div class="w3a-spinner__head"></div>
                </div>
                <div class="w3ajs-modal-loader__label w3a-spinner-label"></div>
                <div class="w3ajs-modal-loader__message w3a-spinner-message" style="display: none"></div>
              </div>
              <div class="w3a-spinner-power">
                <loaderSvg/>
              </div>
          </div>
          <button class="w3a-header__button w3ajs-loader-close-btn">
              <img src="${closeIcon}" alt="">
          </button>
        </div>
      </div> -->
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!connected" @click="switchChain" style="cursor: pointer">Switch Chain</button>
    </section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!connected" @click="connect" style="cursor: pointer">{{ loginButtonStatus }} Connect</button>
      <button v-if="connected" @click="logout" style="cursor: pointer">logout</button>
      <SolRpc v-if="connected && provider && web3auth.options.chainNamespace === 'solana'" :provider="provider" :console="console"></SolRpc>
      <EthRpc v-if="connected && provider && web3auth.options.chainNamespace === 'eip155'" :provider="provider" :console="console"></EthRpc>
      <button v-if="connected" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <button @click="showError" style="cursor: pointer">Show Error</button>
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Web3Auth } from "@web3auth/web3auth";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, Web3AuthError } from "@web3auth/base";
import EthRpc from "./ethRpc.vue";
import SolRpc from "./solanaRpc.vue";

import loader from "./assets/torus-power.svg";

export default Vue.extend({
  name: "BeginnerExampleMode",
  data() {
    return {
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined,
      web3auth: new Web3Auth({ chainNamespace: CHAIN_NAMESPACES.EIP155, clientId: "localhost-id" }),
    };
  },
  components: {
    loaderSvg: loader,
    EthRpc,
    SolRpc,
  },
  async mounted() {
    try {
      this.loading = true;
      const namespace = localStorage.getItem("chainNamespace");
      if (namespace === "solana") {
        await this.initSolanaAuth();
      } else {
        await this.initEthAuth();
      }
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async initSolanaAuth() {
      try {
        this.web3auth = new Web3Auth({ chainNamespace: CHAIN_NAMESPACES.SOLANA, chainConfig: { chainId: "0x3"}, clientId: "localhost-id", authMode: "DAPP" });
        this.subscribeAuthEvents(this.web3auth);
        await this.web3auth.initModal({});
      } catch (error) {
        this.console("error", error);
      }
    },
    async initEthAuth() {
      try {
        this.web3auth = new Web3Auth({ chainNamespace: CHAIN_NAMESPACES.EIP155, clientId: "localhost-id" });
        this.subscribeAuthEvents(this.web3auth);
        await (this.web3auth as Web3Auth).initModal({});
      } catch (error) {
        console.log("error", error);
        this.console("error sss", error);
      }
    },
    async switchChain() {
      console.log("this.namespace", this.web3auth.options.chainNamespace);
      if (this.web3auth.options.chainNamespace === "solana") {
        await this.initEthAuth();
        localStorage.setItem("chainNamespace", this.web3auth.options.chainNamespace);
      } else if (this.web3auth.options.chainNamespace === "eip155") {
        await this.initSolanaAuth();
        localStorage.setItem("chainNamespace", this.web3auth.options.chainNamespace);
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
    showError() {
      this.web3auth.emit(
        ADAPTER_STATUS.ERRORED,
        {
          code: 1,
          message: "Show Error",
        } as Web3AuthError
      );
    },
  },
});
</script>
