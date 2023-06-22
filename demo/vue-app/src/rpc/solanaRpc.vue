<template>
  <div class="mt-4 w-full">
    <div class="flex gap-4 items-center w-full">
      <Button variant="secondary" pill block class="connect-btn" @click="onSignAndSendTransaction">Sign and send txn</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onSignTransaction">Sign txn</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onSignMessage">Sign Message</Button>
    </div>

    <div class="flex gap-4 items-center w-full mt-4">
      <Button variant="secondary" pill block class="connect-btn" @click="onSignAllTransactions">Sign Multiple Transactions</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onGetAccounts">Get Account</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onGetBalance">Get Balance</Button>
    </div>
  </div>
</template>

<script lang="ts">
import { Button } from "@toruslabs/vue-components";
import { defineComponent } from "vue";

import { getAccounts, getBalance, signAllTransactions, signAndSendTransaction, signMessage, signTransaction } from "../lib/sol";

export default defineComponent({
  name: "SolanaRpc",
  props: ["provider", "console"],
  components: {
    Button,
  },
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

<style scoped>
.connect-btn {
  border-color: #6f717a !important;
  color: #6f717a !important;
}
</style>
