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
      <button class="rpcBtn" @click="addChain" style="cursor: pointer">Add Chain</button>
      <button class="rpcBtn" @click="switchChain" style="cursor: pointer">Switch Chain</button>
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
import { getEvmChainConfig } from "@web3auth/base";
import { defineComponent } from "vue";

import { getAccounts, getBalance, getChainId, sendEth, signEthMessage, signTransaction } from "../lib/eth";

export default defineComponent({
  name: "EthRpc",
  props: ["provider", "uiConsole", "connectedAdapter", "web3auth"],
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
      await sendEth(this.provider, this.uiConsole);
    },
    async onSignTx() {
      await signTransaction(this.provider, this.uiConsole);
    },
    async onSignEthMessage() {
      await signEthMessage(this.provider, this.uiConsole);
    },
    async onGetAccounts() {
      await getAccounts(this.provider, this.uiConsole);
    },
    async getConnectedChainId() {
      await getChainId(this.provider, this.uiConsole);
    },
    async onGetBalance() {
      await getBalance(this.provider, this.uiConsole);
    },
    async switchChain() {
      try {
        await this.web3auth.switchChain({ chainId: 137 });
        this.uiConsole("switchedChain");
      } catch (error) {
        console.log("error while switching chain", error);
        this.uiConsole("switchedChain error", error);
      }
    },
    async addChain() {
      try {
        const chain = getEvmChainConfig(137);
        await this.web3auth.addChain(chain);
        this.uiConsole("added chain");
      } catch (error) {
        console.log("error while adding chain", error);
        this.uiConsole("add chain error", error);
      }
    },
  },
});
</script>
