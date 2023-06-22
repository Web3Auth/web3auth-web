<template>
  <div v-if="loading" class="flex flex-col items-center justify-center">
    <Loader useSpinner :size="80" />
  </div>
  <div v-else class="flex flex-col items-center justify-center">
    <h2 class="text-2xl font-bold text-app-gray-900">Login With Web3Auth</h2>
    <Button v-if="!provider" variant="secondary" name="walletConnect" @click="connect" class="connect-btn mt-4 w-[320px]" pill>
      Login With Wallet Connect
    </Button>
    <div class="flex gap-4 items-center w-full mt-4">
      <Button v-if="provider" variant="secondary" @click="logout" class="connext-btn mt-4" pill block>Logout</Button>
    </div>
    <EthRpc v-if="provider" :provider="provider" :console="console"></EthRpc>
    <span>{{ web3auth.status }}</span>
    <div id="console" style="white-space: pre-line" class="mt-10 console-container bg-app-gray-200 shadow-md rounded-lg p-4">
      <p style="white-space: pre-line" class="text-xs font-normal break-words console-inner-container overflow-y-auto overflow-x-auto"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { Button, Loader } from "@toruslabs/vue-components";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { WalletConnectV1Adapter } from "@web3auth/wallet-connect-v1-adapter";
import { defineComponent } from "vue";

import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

let web3AuthInstance = null;

const getWeb3Auth = () => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3AuthNoModal({
      chainConfig: { chainId: "0x3", chainNamespace: CHAIN_NAMESPACES.EIP155 },
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
  name: "BeginnerExampleMode",
  data() {
    return {
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined,
      web3auth: new Web3AuthNoModal({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId["mainnet"] }),
    };
  },
  components: {
    Loader,
    EthRpc,
    Button,
  },
  async mounted() {
    await this.initWeb3Auth();
  },
  methods: {
    async initWeb3Auth() {
      try {
        const web3auth = getWeb3Auth();
        this.subscribeAuthEvents(web3auth);
        const adapter = new WalletConnectV1Adapter({ adapterSettings: { qrcodeModal: QRCodeModal } });
        web3auth.configureAdapter(adapter);
        await web3auth.init();
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      }
    },
    subscribeAuthEvents(web3auth: Web3AuthNoModal) {
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
        this.provider = await getWeb3Auth().connectTo(WALLET_ADAPTERS.WALLET_CONNECT_V1);
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
      const userInfo = await getWeb3Auth().getUserInfo();
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
