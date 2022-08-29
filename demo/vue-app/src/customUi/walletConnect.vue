<template>
  <div id="app">
    <h2>Login With Web3Auth</h2>
    <Loader :isLoading="loading"></Loader>
    <section
      :style="{
        fontSize: '12px',
      }"
    ></section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!provider" name="walletConnect" @click="connect" style="cursor: pointer">Login With Wallet Connect</button>
      <button class="rpcBtn" v-if="provider" @click="logout" style="cursor: pointer">Logout</button>
      <EthRpc v-if="provider" :provider="provider" :console="console"></EthRpc>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <span>{{ web3auth.status }}</span>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import QRCodeModal from "@walletconnect/qrcode-modal";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3AuthCore } from "@web3auth/core";
import { WalletConnectV1Adapter } from "@web3auth/wallet-connect-v1-adapter";
import Vue from "vue";

import Loader from "../components/loader.vue";
import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

export default Vue.extend({
  name: "BeginnerExampleMode",
  data() {
    return {
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined,
      web3auth: new Web3AuthCore({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId  }),
    };
  },
  components: {
    Loader,
    EthRpc,
  },
  async mounted() {
    await this.initWeb3Auth();
  },
  methods: {
    async initWeb3Auth() {
      try {
        this.web3auth = new Web3AuthCore({ chainConfig: { chainId: "0x3", chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId  });
        this.subscribeAuthEvents(this.web3auth);
        const adapter = new WalletConnectV1Adapter({ adapterSettings: { qrcodeModal: QRCodeModal } });
        this.web3auth.configureAdapter(adapter);
        await this.web3auth.init();
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      }
    },
    subscribeAuthEvents(web3auth: Web3AuthCore) {
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
    async connect(e) {
      try {
        await this.web3auth.connectTo(WALLET_ADAPTERS.WALLET_CONNECT_V1);
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
