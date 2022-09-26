<template>
  <div id="app">
    <div class="text-h4 mb-3">Web3Auth TSS Demo</div>
    <Loader :isLoading="loading"></Loader>

    <!-- TSS SIGN SCREEN -->
    <div v-if="provider">
      <SignTSS />
    </div>

    <!-- LOGIN SCREEN -->
    <div class="pt-16">
      <v-btn v-if="!provider" color="primary" @click="connect" style="cursor: pointer">Login</v-btn>
      <div v-if="provider">
        <v-btn small class="mt-10" text color="primary" @click="logout" style="cursor: pointer">Logout</v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { Web3Auth } from "@web3auth/web3auth";
import Vue from "vue";

import Loader from "@/components/loader.vue";
import SignTSS from "@/components/signTss.vue";

import config from "../config";

const ethChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace"> = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1",
  // rpcTarget: `https://ropsten.infura.io/v3/776218ac4734478c90191dde8cae483c`,
  // displayName: "ropsten",
  // blockExplorer: "https://ropsten.etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};

export default Vue.extend({
  name: "EthereumChain",
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
      await this.initEthAuth();
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
      connecting: false,
      provider: undefined,
      web3auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId, enableLogging: true }),
    };
  },
  components: {
    Loader,
    SignTSS,
  },

  async mounted() {
    await this.initEthAuth();
  },
  methods: {
    parseConfig() {
      this.modalConfig = {
        "torus-evm": {
          name: "Torus-evm",
          showOnModal: false,
        },
        metamask: {
          name: "Metamask",
          showOnModal: false,
        },
        openlogin: {
          name: "Openlogin",
          showOnModal: true,
          loginMethods: {
            google: {
              name: "Google",
              showOnModal: false,
            },
            facebook: {
              name: "Facebook",
              showOnModal: false,
            },
            twitter: {
              name: "Twitter",
              showOnModal: false,
            },
            reddit: {
              name: "Reddit",
              showOnModal: false,
            },
            discord: {
              name: "Discord",
              showOnModal: false,
            },
            twitch: {
              name: "Twitch",
              showOnModal: false,
            },
            apple: {
              name: "Apple",
              showOnModal: false,
            },
            line: {
              name: "Line",
              showOnModal: false,
            },
            github: {
              name: "Github",
              showOnModal: false,
            },
            kakao: {
              name: "Kakao",
              showOnModal: false,
            },
            linkedin: {
              name: "Linkedin",
              showOnModal: false,
            },
            weibo: {
              name: "Weibo",
              showOnModal: false,
            },
            wechat: {
              name: "Wechat",
              showOnModal: false,
            },
            email_passwordless: {
              name: "Email_passwordless",
              showOnModal: true,
            },
          },
        },
        "wallet-connect-v1": {
          name: "Wallet-connect-v1",
          showOnModal: false,
        },
        coinbase: {
          name: "Coinbase",
          showOnModal: false,
        },
      };
    },
    async initEthAuth() {
      try {
        this.parseConfig();
        this.loading = true;
        this.web3auth = new Web3Auth({
          chainConfig: ethChainConfig,
          clientId: config.clientId,
          authMode: "DAPP",
          enableLogging: true,
        });
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId,
            uxMode: "redirect",
          },
        });

        this.web3auth.configureAdapter(openloginAdapter);
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
      web3auth.on(ADAPTER_STATUS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
        this.console("connected to wallet", data);
        this.provider = web3auth.provider;
        this.loginButtonStatus = "Logged in";
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.console("connecting");
        this.connecting = true;
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
        const web3authProvider = await this.web3auth.connect();
        this.provider = web3authProvider;
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },
    async logout() {
      this.provider = null;
      await this.web3auth.logout();
      this.provider = undefined;
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
