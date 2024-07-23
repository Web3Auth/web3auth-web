<template>
  <section
    :style="{
      fontSize: '12px',
    }"
  >
    <button class="rpcBtn" type="button" style="cursor: pointer" @click="onSignAndSendTransaction">Sign and send txn</button>
    <button class="rpcBtn" type="button" style="cursor: pointer" @click="onSignTransaction">Sign txn</button>
    <button class="rpcBtn" type="button" style="cursor: pointer" @click="onSignMessage">Sign Message</button>
    <button class="rpcBtn" type="button" style="cursor: pointer" @click="onSignAllTransactions">Sign Multiple Transactions</button>
    <button class="rpcBtn" type="button" style="cursor: pointer" @click="onGetAccounts">Get Account</button>
    <button class="rpcBtn" type="button" style="cursor: pointer" @click="onGetBalance">Get Balance</button>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { getAccounts, getBalance, signAllTransactions, signAndSendTransaction, signMessage, signTransaction } from "../lib/sol";

export default defineComponent({
  name: "SolanaRpc",
  props: ["provider", "uiConsole"],
  data() {
    return {};
  },
  methods: {
    async onSignAndSendTransaction() {
      await signAndSendTransaction(this.provider, this.uiConsole);
    },
    async onSignTransaction() {
      await signTransaction(this.provider, this.uiConsole);
    },
    async onSignMessage() {
      await signMessage(this.provider, this.uiConsole);
    },
    async onSignAllTransactions() {
      await signAllTransactions(this.provider, this.uiConsole);
    },
    async onGetAccounts() {
      await getAccounts(this.provider, this.uiConsole);
    },
    async onGetBalance() {
      return getBalance(this.provider, this.uiConsole);
    },
  },
});
</script>
