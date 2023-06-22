<template>
  <div v-if="loading" class="flex flex-col items-center justify-center">
    <Loader useSpinner :size="80" />
  </div>
  <div v-else class="flex flex-col items-center justify-center">
    <h2 class="text-2xl font-bold text-app-gray-900">Login with Web3Auth</h2>
    <h3 class="text-lg font-normal text-app-gray-500">Connect with {{ Web3Auth?.options.chainConfig.chainNamespace || "" }} web3Auth</h3>
    <Button v-if="!provider" variant="secondary" @click="connect" class="connect-btn mt-4 w-[320px]" pill>Connect</Button>
    <div class="flex gap-4 items-center w-full mt-4">
      <Button v-if="provider" @click="logout" variant="secondary" pill block class="connect-btn">Logout</Button>
      <Button v-if="provider" @click="getUserInfo" variant="secondary" pill block class="connect-btn">Get User Info</Button>
    </div>
    <EthRpc v-if="provider && Web3Auth.options.chainConfig.chainNamespace === 'eip155'" :provider="provider" :console="console"></EthRpc>
    <div id="console" style="white-space: pre-line" class="mt-10 console-container bg-app-gray-200 shadow-md rounded-lg p-4">
      <p style="white-space: pre-line" class="text-xs font-normal break-words console-inner-container overflow-y-auto overflow-x-auto"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { Button, Loader } from "@toruslabs/vue-components";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { defineComponent } from "vue";

import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

let web3AuthInstance = null;

const getWeb3Auth = (uiConfig: any) => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3Auth({
      uiConfig: {
        appLogo: uiConfig.logoUrl,
        theme: uiConfig.theme,
        loginMethodsOrder: uiConfig.loginMethodsOrder,
        defaultLanguage: uiConfig.defaultLanguage,
      },
      web3AuthNetwork: "testnet",
      chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
      clientId: config.clientId["mainnet"],
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
  name: "WhitelabelExample",
  props: {
    uiConfig: {
      type: Object,
      default: () => ({
        theme: "light",
        logoUrl: "https://images.web3auth.io/example-hello.svg",
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
      Web3Auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId["mainnet"] }),
    };
  },
  components: {
    EthRpc,
    Loader,
    Button,
  },
  async mounted() {
    await this.initWhitelabledModal();
  },
  methods: {
    async initWhitelabledModal() {
      try {
        this.loading = true;
        const web3auth = getWeb3Auth(this.uiConfig);
        this.subscribeAuthEvents(web3auth);
        await web3auth.initModal();
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
        const web3authProvider = await getWeb3Auth(this.uiConfig);
        const webProvider = await web3authProvider.connect();
        this.Web3Auth = web3authProvider;
        this.provider = webProvider;
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
      const userInfo = await getWeb3Auth(this.uiConfig).getUserInfo();
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
