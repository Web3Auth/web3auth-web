<template>
  <div id="app">
    <h2>Login with Web3Auth</h2>
    <h3>Connect with {{ web3auth.options.chainConfig.chainNamespace }} web3auth</h3>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <Loader :is-loading="loading" />
    </section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!provider" type="button" class="rpcBtn" style="cursor: pointer" @click="connect">Connect</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="logout">Logout</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="getUserInfo">Get User Info</button>
      <EthRpc v-if="provider && web3auth.options.chainConfig.chainNamespace === 'eip155'" :provider="provider" :console="console"></EthRpc>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, log } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { defineComponent } from "vue";

import Loader from "../components/loader.vue";
import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

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

const ethWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: ethereumChainConfig,
  enableLogging: true,
  clientId: config.clientId.mainnet,
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: ethereumChainConfig } }),
};

export default defineComponent({
  name: "WhitelabelExample",
  components: {
    EthRpc,
    Loader,
  },
  props: {
    uiConfig: {
      type: Object,
      default: () => ({
        theme: "light",
        logoUrl: "https://images.web3auth.io/example-hello.svg",
      }),
    },
  },
  data() {
    return {
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined,
      web3auth: new Web3Auth(ethWeb3AuthOptions),
    };
  },
  watch: {
    async uiConfig() {
      // watch it
      await this.initWhitelabledModal();
    },
  },
  async mounted() {
    await this.initWhitelabledModal();
  },
  methods: {
    async initWhitelabledModal() {
      try {
        this.loading = true;
        this.web3auth = new Web3Auth({
          privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: ethereumChainConfig } }),
          uiConfig: {
            logoLight: this.uiConfig.logoUrl,
            logoDark: this.uiConfig.logoUrl,
            theme: this.uiConfig.theme,
            loginMethodsOrder: this.uiConfig.loginMethodsOrder,
            defaultLanguage: this.uiConfig.defaultLanguage,
          },
          web3AuthNetwork: "testnet",
          chainConfig: ethereumChainConfig,
          clientId: config.clientId.mainnet,
        });
        this.subscribeAuthEvents(this.web3auth);
        await this.web3auth.initModal();
      } catch (error) {
        log.log("error", error);
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
        log.log("error", error);
        this.console("errored", error);
        this.loginButtonStatus = "";
      });
    },
    async connect() {
      try {
        this.provider = await this.web3auth.connect();
      } catch (error) {
        log.error(error);
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
