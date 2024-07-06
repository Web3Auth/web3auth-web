<template>
  <div id="app">
    <h2>Login with Web3Auth and Ethereum</h2>
    <Loader :isLoading="loading"></Loader>

    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!provider" @click="connect" style="cursor: pointer">Connect</button>
      <button class="rpcBtn" v-if="provider" @click="logout" style="cursor: pointer">Logout</button>
      <button class="rpcBtn" v-if="provider" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <button class="rpcBtn" v-if="provider" @click="authenticateUser" style="cursor: pointer">Get Auth Id token</button>
      <EthRpc
        :connectedAdapter="web3auth.connectedAdapterName"
        v-if="provider"
        :provider="provider"
        :uiConsole="uiConsole"
        :web3auth="web3auth"
      ></EthRpc>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { ADAPTER_STATUS, CONNECTED_EVENT_DATA, LoginMethodConfig, mainnet, WALLET_ADAPTERS } from "@web3auth/base";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { defineComponent } from "vue";

import Loader from "@/components/loader.vue";

import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

const ethWeb3AuthOptions: Web3AuthOptions = {
  chainConfig: mainnet,
  enableLogging: true,
  clientId: config.clientId["mainnet"],
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: mainnet } }),
};

export default defineComponent({
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
      web3auth: new Web3Auth(ethWeb3AuthOptions),
    };
  },
  components: {
    EthRpc,
    Loader,
  },

  async mounted() {
    await this.initEthAuth();
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
    async initEthAuth() {
      try {
        this.parseConfig();
        this.loading = true;
        this.web3auth = new Web3Auth(ethWeb3AuthOptions);
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId[this.openloginNetwork],
            buildEnv: "testing",
          },
        });
        // Only when you want to add External default adapters, which includes WalletConnect, Metamask, Torus EVM Wallet
        const adapters = await getDefaultExternalAdapters({ options: ethWeb3AuthOptions });
        adapters.forEach((adapter) => {
          this.web3auth.configureAdapter(adapter);
        });

        this.web3auth.configureAdapter(openloginAdapter);

        if (this.plugins["walletServices"]) {
          const walletServicesPlugin = new WalletServicesPlugin({
            wsEmbedOpts: {},
            walletInitOptions: { whiteLabel: { showWidgetButton: true } },
          });

          await this.web3auth.addPlugin(walletServicesPlugin);
        }

        this.subscribeAuthEvents(this.web3auth);

        await this.web3auth.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.METAMASK]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "Metamask",
            },
            [WALLET_ADAPTERS.WALLET_CONNECT_V2]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "Wallet Connect",
            },
            [WALLET_ADAPTERS.TORUS_EVM]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "Torus",
            },
            [WALLET_ADAPTERS.OPENLOGIN]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "OpenLogin",
            },
          },
        });
      } catch (error) {
        console.log("error", error);
        this.uiConsole("error", error);
      } finally {
        this.loading = false;
      }
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
        this.uiConsole("connected to wallet", data.adapter);
        this.provider = web3auth.provider;
        this.loginButtonStatus = "Logged in";
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.uiConsole("connecting");
        this.connecting = true;
        this.loginButtonStatus = "Connecting...";
      });
      web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
        this.uiConsole("disconnected");
        this.loginButtonStatus = "";
        this.provider = undefined;
      });
      web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
        console.log("error", error);
        this.uiConsole("errored", error);
        this.loginButtonStatus = "";
      });
      // web3auth.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible) => {
      //   this.connecting = isVisible;
      // });
    },
    async connect() {
      try {
        const web3authProvider = await this.web3auth.connect();
        this.provider = web3authProvider;
      } catch (error) {
        console.error(error);
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
