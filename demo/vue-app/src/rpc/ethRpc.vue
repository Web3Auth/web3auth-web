<template>
  <div>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="connectedAdapter === 'openlogin'" @click="onSignTx" style="cursor: pointer">Sign Transaction</button>

      <button class="rpcBtn" @click="onSendEth" style="cursor: pointer">Send Eth</button>
      <button class="rpcBtn" @click="onSignEthMessage" style="cursor: pointer">Sign eth message</button>
      <button class="rpcBtn" @click="onGetAccounts" style="cursor: pointer">Get Account</button>
      <button class="rpcBtn" @click="getConnectedChainId" style="cursor: pointer">Get chainId</button>
      <button class="rpcBtn" @click="onGetBalance" style="cursor: pointer">Get Balance</button>
      <button class="rpcBtn" v-if="connectedAdapter === 'openlogin'" @click="addChain" style="cursor: pointer">Add Chain</button>
      <button class="rpcBtn" v-if="connectedAdapter === 'openlogin' || connectedAdapter === 'metamask'" @click="switchChain" style="cursor: pointer">
        Switch Chain
      </button>
    </section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <span
        :style="{
          fontSize: '20px',
          fontWeight: 'bold',
        }"
      >
        Connection Status: {{ networkState }}
      </span>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import { getAccounts, getBalance, getChainId, sendEth, signEthMessage, signTransaction } from "../lib/eth";

export default Vue.extend({
  name: "EthRpc",
  props: ["provider", "console", "connectedAdapter"],
  data() {
    return {};
  },
  computed: {
    networkState: function () {
      return this.provider.chainId === "loading" ? "connecting" : "connected";
    },
  },
  methods: {
    async onSendEth() {
      await sendEth(this.provider, this.console);
    },
    async onSignTx() {
      await signTransaction(this.provider, this.console);
    },
    async onSignEthMessage() {
      await signEthMessage(this.provider, this.console);
    },
    async onGetAccounts() {
      await getAccounts(this.provider, this.console);
    },
    async getConnectedChainId() {
      await getChainId(this.provider, this.console);
    },
    async onGetBalance() {
      await getBalance(this.provider, this.console);
    },
    async switchChain() {
      try {
        await this.provider.sendAsync({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4" }],
        });
        this.console("switchedChain");
      } catch (error) {
        console.log("error while switching chain", error);
        this.console("switchedChain error", error);
      }
    },
    async addChain() {
      try {
        await this.provider.sendAsync({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x4",
              chainName: "rinkeby",
              nativeCurrency: {
                name: "ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [`https://rpc.ankr.com/eth_rinkeby`],
              blockExplorerUrls: [`https://rinkeby.etherscan.io/`],
            },
          ],
        });
        this.console("added chain");
      } catch (error) {
        console.log("error while adding chain", error);
        this.console("add chain error", error);
      }
    },
  },
});
</script>
