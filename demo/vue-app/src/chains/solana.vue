<template>
  <div v-if="loading" class="flex flex-col items-center justify-center">
    <Loader useSpinner :size="80" />
  </div>
  <div v-else class="flex flex-col items-center justify-center">
    <h2 class="text-2xl font-bold text-app-gray-900">Login with Web3Auth and Solana</h2>
    <Button v-if="!provider" variant="secondary" pill class="connect-btn mt-4 w-[320px]" @click="connect">Connect</Button>
    <div class="flex gap-4 items-center w-full mt-4">
      <Button v-if="provider" variant="secondary" pill block class="connect-btn" @click="logout">Logout</Button>
      <Button v-if="provider" variant="secondary" pill block class="connect-btn" @click="getUserInfo">Get User Info</Button>
      <Button v-if="provider" variant="secondary" pill block class="connect-btn" @click="authenticateUser">Get Auth Id token</Button>
    </div>
    <SolanaRpc v-if="provider" :provider="provider" :console="console"></SolanaRpc>
    <div id="console" style="white-space: pre-line" class="mt-10 console-container bg-app-gray-200 shadow-md rounded-lg p-4">
      <p style="white-space: pre-line" class="text-xs font-normal break-words console-inner-container overflow-y-auto overflow-x-auto"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { Button, Loader } from "@toruslabs/vue-components";
import {
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  LoginMethodConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { SlopeAdapter } from "@web3auth/slope-adapter";
import { SolanaWalletConnectorPlugin } from "@web3auth/solana-wallet-connector-plugin";
import { SolflareAdapter } from "@web3auth/solflare-adapter";
import { SolanaWalletAdapter } from "@web3auth/torus-solana-adapter";
import { defineComponent } from "vue";

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

let web3AuthInstance = null;

const getWeb3Auth = (openloginNetwork: string) => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3Auth({
      chainConfig: solanaChainConfig,
      clientId: config.clientId[openloginNetwork],
      authMode: "DAPP",
      enableLogging: true,
    });
  }
  return web3AuthInstance;
};

const logOutWeb3Auth = () => {
  if (web3AuthInstance) {
    web3AuthInstance.logout();
  }
};

export default defineComponent({
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
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
      provider: undefined,
      Web3Auth: undefined,
    };
  },
  components: {
    SolanaRpc,
    Loader,
    Button,
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
        const web3auth = getWeb3Auth(this.openloginNetwork);
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId[this.openloginNetwork],
          },
        });
        const slopeAdapter = new SlopeAdapter();
        const solflareAdapter = new SolflareAdapter();
        const solAdapter = new SolanaWalletAdapter({ initParams: { buildEnv: "testing" } });
        web3auth.configureAdapter(solAdapter);
        web3auth.configureAdapter(solflareAdapter);
        web3auth.configureAdapter(slopeAdapter);
        web3auth.configureAdapter(openloginAdapter);
        if (this.plugins["torusWallet"]) {
          const torusPlugin = new SolanaWalletConnectorPlugin({
            torusWalletOpts: {},
            walletInitOptions: {
              enableLogging: true,
            },
          });
          await web3auth.addPlugin(torusPlugin);
        }
        this.subscribeAuthEvents(web3auth);
        await web3auth.initModal({
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
        const web3authProvider = await getWeb3Auth(this.openloginNetwork);
        const webProvider = await web3authProvider.connect();
        this.Web3Auth = web3authProvider;
        await this.setupProvider(webProvider);
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },

    async logout() {
      await logOutWeb3Auth();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await getWeb3Auth(this.openloginNetwork).getUserInfo();
      this.console(userInfo);
    },
    async authenticateUser() {
      const idTokenDetails = await getWeb3Auth(this.openloginNetwork).authenticateUser();
      this.console(idTokenDetails);
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

<style scoped>
.connect-btn {
  border-color: #6f717a !important;
  color: #6f717a !important;
}
.console-container {
  width: 500px;
  height: 350px;
}
.console-inner-container {
  width: 468px;
  height: 328px;
}
</style>
