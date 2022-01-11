<template>
  <section
    :style="{
      fontSize: '12px',
    }"
  >
    <button @click="onSendEth" style="cursor: pointer">Send Eth</button>
    <button @click="onSignEthMessage" style="cursor: pointer">Sign eth message</button>
    <button @click="onGetAccounts" style="cursor: pointer">Get Account</button>
    <button @click="onGetBalance" style="cursor: pointer">Get Balance</button>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import { sendEth, signEthMessage, getAccounts, getBalance } from "../lib/eth"

export default Vue.extend({
  name: "EthRpc",
  props: ["provider", "console"],
  data() {
    return {};
  },
  methods: {
    async onSendEth() {
      await sendEth(this.provider, this.console);
    },
    async onSignEthMessage() {
      await signEthMessage(this.provider, this.console);
    },
    async onGetAccounts() {
      await getAccounts(this.provider, this.console);
    },
    async onGetBalance() {
      await getBalance(this.provider, this.console);
    },
  },
});
</script>
