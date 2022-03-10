<template>
  <section
    :style="{
      fontSize: '12px',
    }"
  >
    <button class="rpcBtn" @click="onSignAndSendTransaction" style="cursor: pointer">Sign and send txn</button>
    <button class="rpcBtn" @click="onSignTransaction" style="cursor: pointer">Sign txn</button>
    <button class="rpcBtn" @click="onSignMessage" style="cursor: pointer">Sign Message</button>
    <button class="rpcBtn" @click="onSignAllTransactions" style="cursor: pointer">Sign Multiple Transactions</button>
    <button class="rpcBtn" @click="onGetAccounts" style="cursor: pointer">Get Account</button>
    <button class="rpcBtn" @click="onGetBalance" style="cursor: pointer">Get Balance</button>
  </section>
</template>

<script lang="ts">
import Vue from "vue";

import { getAccounts, getBalance, signAllTransactions, signAndSendTransaction, signMessage, signTransaction } from "../lib/sol";

export default Vue.extend({
  name: "SolanaRpc",
  props: ["provider", "console"],
  data() {
    return {};
  },
  methods: {
    async onSignAndSendTransaction() {
      await signAndSendTransaction(this.provider, this.console);
    },
    async onSignTransaction() {
      await signTransaction(this.provider, this.console);
    },
    async onSignMessage() {
      await signMessage(this.provider, this.console);
    },
    async onSignAllTransactions() {
      await signAllTransactions(this.provider, this.console);
    },
    async onGetAccounts() {
      await getAccounts(this.provider, this.console);
    },
    async onGetBalance() {
      return await getBalance(this.provider, this.console);
    },
  },
});
</script>
