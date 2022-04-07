<template>
  <div id="app">
    <h2>Login with Web3Auth and Solana</h2>
    <Loader :isLoading="loading"></Loader>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!provider" @click="connect" style="cursor: pointer">Connect</button>
      <button class="rpcBtn" v-if="provider" @click="logout" style="cursor: pointer">Logout</button>
      <button class="rpcBtn" v-if="provider" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <SolanaRpc v-if="provider" :provider="provider" :console="console"></SolanaRpc>
      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  LoginMethodConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { InjectedProvider, TorusInjectedProvider } from "@web3auth/solana-provider";
import { SolanaWalletConnectorPlugin } from "@web3auth/solana-wallet-connector-plugin";
import { SolletAdapter, SolletExtensionAdapter } from "@web3auth/sollet-adapter";
import { Web3Auth } from "@web3auth/web3auth";
import Vue from "vue";

import Loader from "@/components/loader.vue";

import config from "../config";
import SolanaRpc from "../rpc/solanaRpc.vue";
const solanaChainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  rpcTarget: "https://api.devnet.solana.com",
  blockExplorer: "https://explorer.solana.com?cluster=devnet",
  chainId: "0x3",
  displayName: "devnet",
  ticker: "SOL",
  tickerName: "solana",
};

export default Vue.extend({
  name: "SolanaChain",
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
      await this.initSolanaAuth();
    },
    openloginNetwork: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initEthAuth();
    },
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
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
    async initSolanaAuth() {
      try {
        this.parseConfig();

        this.loading = true;
        this.web3auth = new Web3Auth({ chainConfig: solanaChainConfig, clientId: config.clientId, authMode: "DAPP" });
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork,
            clientId: config.clientId,
          },
        });
        const solletAdapter = new SolletAdapter();
        const solletExtensionAdapter = new SolletExtensionAdapter();
        this.web3auth.configureAdapter(solletAdapter);
        this.web3auth.configureAdapter(solletExtensionAdapter);
        this.web3auth.configureAdapter(openloginAdapter);
        if (this.plugins["torusWallet"]) {
          const torusPlugin = new SolanaWalletConnectorPlugin({
            torusWalletOpts: {},
            walletInitOptions: {
              enableLogging: true,
            },
          });
          await this.web3auth.addPlugin(torusPlugin);
        }
        this.subscribeAuthEvents(this.web3auth);
        await this.web3auth.initModal({
          modalConfig: {
            // to hide social login methods
            [WALLET_ADAPTERS.OPENLOGIN]: {
              loginMethods: {
                twitter: {
                  name: "twitter",
                  showOnModal: false,
                },
              },
            },
          },
        });
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      } finally {
        this.loading = false;
      }
    },
    async setupProvider(provider: SafeEventEmitterProvider) {
      this.provider = provider;
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
        this.console("connected to wallet", data);
        await this.setupProvider(web3auth.provider);
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
        const provider = await this.web3auth.connect();
        await this.setupProvider(provider);
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
