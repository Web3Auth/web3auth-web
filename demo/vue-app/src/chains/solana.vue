<template>
  <div id="app">
    <h2>Login with Web3Auth and Solana</h2>
    <Loader :is-loading="loading"></Loader>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!provider" type="button" class="rpcBtn" style="cursor: pointer" @click="connect">Connect</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="logout">Logout</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="getUserInfo">Get User Info</button>
      <button v-if="provider" type="button" class="rpcBtn" style="cursor: pointer" @click="authenticateUser">Get Auth Id token</button>
      <SolanaRpc v-if="provider" :provider="provider" :ui-console="uiConsole"></SolanaRpc>
      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import {
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  log,
  LoginMethodConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { getDefaultExternalAdapters } from "@web3auth/default-solana-adapter";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { SlopeAdapter } from "@web3auth/slope-adapter";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { defineComponent } from "vue";

import Loader from "../components/loader.vue";
import config from "../config";
import SolanaRpc from "../rpc/solanaRpc.vue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const solanaChainConfig: any = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  rpcTarget: "https://rpc.ankr.com/solana_devnet",
  blockExplorerUrl: "https://solscan.io",
  logo: "https://cryptologos.cc/logos/solana-sol-logo.png",
  chainId: "0x3",
  ticker: "SOL",
  tickerName: "Solana",
};

const solanaWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: solanaChainConfig,
  enableLogging: true,
  clientId: config.clientId.mainnet,
  privateKeyProvider: new SolanaPrivateKeyProvider({ config: { chainConfig: solanaChainConfig } }),
};

export default defineComponent({
  name: "SolanaChain",
  components: {
    SolanaRpc,
    Loader,
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
      web3auth: new Web3Auth(solanaWeb3AuthOptions),
    };
  },
  watch: {
    async adapterConfig() {
      // watch it
      await this.initSolanaAuth();
    },
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
        this.web3auth = new Web3Auth(solanaWeb3AuthOptions);
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId[this.openloginNetwork],
          },
        });
        const slopeAdapter = new SlopeAdapter();
        this.web3auth.configureAdapter(slopeAdapter);
        this.web3auth.configureAdapter(openloginAdapter);
        const adapters = await getDefaultExternalAdapters({ options: this.web3auth.options });
        adapters.forEach((adapter) => {
          this.web3auth.configureAdapter(adapter);
        });
        this.subscribeAuthEvents(this.web3auth);
        await this.web3auth.initModal({
          modalConfig: {
            // to hide social login methods
            [WALLET_ADAPTERS.OPENLOGIN]: {
              label: "OpenLogin",
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
        log.log("error", error);
        this.uiConsole("error", error);
      } finally {
        this.loading = false;
      }
    },
    async setupProvider(provider: SafeEventEmitterProvider) {
      this.provider = provider;
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
        this.uiConsole("connected to wallet", data);
        await this.setupProvider(web3auth.provider);
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
        log.log("error", error);
        this.uiConsole("errored", error);
        this.loginButtonStatus = "";
      });
    },
    async connect() {
      try {
        await this.web3auth.connect();
        await this.setupProvider(this.web3auth.provider);
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
    async authenticateUser() {
      const idTokenDetails = await this.web3auth.authenticateUser();
      this.uiConsole(idTokenDetails);
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
