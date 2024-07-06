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
import { WalletConnectModal } from "@walletconnect/modal";
import { ADAPTER_STATUS, CONNECTED_EVENT_DATA, mainnet, sepolia, WALLET_ADAPTERS, Web3AuthNoModalOptions } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { WalletConnectV2Adapter } from "@web3auth/wallet-connect-v2-adapter";
import { defineComponent } from "vue";

import Loader from "../components/loader.vue";
import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

const ethWeb3AuthOptions: Web3AuthNoModalOptions = {
  chainConfig: mainnet,
  enableLogging: true,
  clientId: config.clientId["mainnet"],
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: mainnet } }),
};

const sepoliaWeb3AuthOptions: Web3AuthNoModalOptions = {
  chainConfig: sepolia,
  enableLogging: true,
  clientId: config.clientId["mainnet"],
  privateKeyProvider: new EthereumPrivateKeyProvider({ config: { chainConfig: sepolia } }),
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
      web3auth: new Web3AuthNoModal(ethWeb3AuthOptions),
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
        this.web3auth = new Web3AuthNoModal(sepoliaWeb3AuthOptions);
        this.subscribeAuthEvents(this.web3auth);
        const adapter = new WalletConnectV2Adapter({
          adapterSettings: { qrcodeModal: new WalletConnectModal({ projectId: "d3c63f19f9582f8ba48e982057eb096b" }) },
        });
        this.web3auth.configureAdapter(adapter);
        await this.web3auth.init();
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
    async connect() {
      try {
        await this.web3auth.connectTo(WALLET_ADAPTERS.WALLET_CONNECT_V2);
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
