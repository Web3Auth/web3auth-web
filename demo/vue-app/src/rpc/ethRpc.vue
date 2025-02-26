<template>
  <div>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="connectedAdapter === 'openlogin'" type="button" class="rpcBtn" style="cursor: pointer" @click="onSignTx">Sign Transaction</button>

      <button class="rpcBtn" type="button" style="cursor: pointer" @click="onSendEth">Send Eth</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="onSignEthMessage">Sign eth message</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="onGetAccounts">Get Account</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="getConnectedChainId">Get chainId</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="onGetBalance">Get Balance</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="addChain">Add Chain</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="switchChain">Switch Chain</button>
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
import { getEvmChainConfig, log } from "@web3auth/base";
import { defineComponent } from "vue";

import { getAccounts, getBalance, getChainId, sendEth, signEthMessage, signTransaction } from "../lib/eth";

export default defineComponent({
  name: "EthRpc",
  props: ["provider", "uiConsole", "connectedAdapter", "web3auth"],
  data() {
    return {};
  },
  computed: {
    networkState() {
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
        await this.web3auth.switchChain({ chainId: "0x89" });
        this.uiConsole("switchedChain");
      } catch (error) {
        log.error("error while switching chain", error);
        this.uiConsole("switchedChain error", error);
      }
    },
    async addChain() {
      try {
        await this.web3auth.addChain(getEvmChainConfig(137));
        this.uiConsole("added chain");
      } catch (error) {
        log.error("error while adding chain", error);
        this.uiConsole("add chain error", error);
      }
    },
  },
});
</script>
