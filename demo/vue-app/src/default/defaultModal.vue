<template>
  <div v-if="loading" class="flex flex-col items-center justify-center">
    <Loader useSpinner :size="80" />
  </div>
  <div v-else class="flex flex-col items-center justify-center">
    <h2 class="text-2xl font-bold text-app-gray-900">Login with Web3Auth</h2>
    <h3 class="text-lg font-normal text-app-gray-500">Connect with {{ Web3Auth.options.chainConfig.chainNamespace }} web3Auth</h3>
    <div v-if="!provider" class="flex gap-4 items-center w-full mt-4">
      <Button variant="secondary" @click="switchChain" class="connect-btn mt-4" pill>
        Switch To {{ Web3Auth.options.chainConfig.chainNamespace === "solana" ? "Ethereum" : "solana" }}
      </Button>
      <Button variant="secondary" @click="connect" class="connect-btn mt-4" pill block>Connect</Button>
    </div>
    <div v-else class="flex gap-4 items-center w-full mt-4">
      <Button @click="logout" class="connect-btn">Logout</Button>
      <Button @click="getUserInfo" class="connect-btn">Get User Info</Button>
    </div>
    <SolRpc v-if="provider && Web3Auth.options.chainConfig.chainNamespace === 'solana'" :provider="provider" :console="console"></SolRpc>
    <EthRpc v-if="provider && Web3Auth.options.chainConfig.chainNamespace === 'eip155'" :provider="provider" :console="console"></EthRpc>
    <div id="console" style="white-space: pre-line" class="mt-10 console-container bg-app-gray-200 shadow-md rounded-lg p-4">
      <p style="white-space: pre-line" class="text-xs font-normal break-words console-inner-container overflow-y-auto overflow-x-auto"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { Button, Loader } from "@toruslabs/vue-components";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, ChainNamespaceType, CONNECTED_EVENT_DATA } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { defineComponent } from "vue";

import config from "@/config";

import EthRpc from "../rpc/ethRpc.vue";
import SolRpc from "../rpc/solanaRpc.vue";

let web3AuthInstance = null;

const getWeb3Auth = (chainName: ChainNamespaceType) => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3Auth({
      chainConfig: { chainId: "0x3", chainNamespace: chainName },
      clientId: config.clientId["mainnet"],
      authMode: "DAPP",
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
  name: "BeginnerExampleMode",
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
    Loader,
    EthRpc,
    SolRpc,
    Button,
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
        const web3auth = getWeb3Auth(CHAIN_NAMESPACES.SOLANA);
        this.subscribeAuthEvents(web3auth);
        await web3auth.initModal();
        console.log("web3auth", web3auth);
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      }
    },
    async initEthAuth() {
      try {
        const web3auth = getWeb3Auth(CHAIN_NAMESPACES.EIP155);
        this.subscribeAuthEvents(web3auth);
        await (web3auth as Web3Auth).initModal();
      } catch (error) {
        console.log("error", error);
        this.console("error sss", error);
      }
    },
    async switchChain() {
      try {
        this.loading = true;
        if (this.Web3Auth.options.chainConfig.chainNamespace === "solana") {
          await this.initEthAuth();
          localStorage.setItem("chainNamespace", this.Web3Auth.options.chainConfig.chainNamespace);
        } else if (this.Web3Auth.options.chainConfig.chainNamespace === "eip155") {
          await this.initSolanaAuth();
          localStorage.setItem("chainNamespace", this.Web3Auth.options.chainConfig.chainNamespace);
        }
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
      try {
        const web3authProvider = await web3AuthInstance.connect();
        this.Web3Auth = web3AuthInstance;
        this.provider = web3authProvider;
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
      const userInfo = await web3AuthInstance.getUserInfo();
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
