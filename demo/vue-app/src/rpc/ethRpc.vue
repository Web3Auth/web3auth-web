<template>
  <div class="mt-4 w-full">
    <div class="flex gap-4 items-center w-full">
      <Button variant="secondary" pill block class="connect-btn" v-if="connectedAdapter === 'openlogin'" @click="onSignTx">Sign Transaction</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onSendEth">Send Eth</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onSignEthMessage">Sign eth message</Button>
    </div>

    <div class="flex gap-4 items-center w-full mt-4">
      <Button variant="secondary" pill block class="connect-btn" @click="onGetAccounts">Get Account</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="getConnectedChainId">Get chainId</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="onGetBalance">Get Balance</Button>
    </div>

    <div class="flex gap-4 items-center w-full mt-4">
      <Button variant="secondary" pill block class="connect-btn" @click="addChain">Add Chain</Button>
      <Button variant="secondary" pill block class="connect-btn" @click="switchChain">Switch Chain</Button>
    </div>

    <p class="mt-4 text-base font-normal">
      Connection Status:
      <Badge variant="success" class="ml-2" pill>{{ networkState }}</Badge>
    </p>
  </div>
</template>

<script lang="ts">
import { Badge, Button } from "@toruslabs/vue-components";
import { getEvmChainConfig } from "@web3auth/base";
import { defineComponent } from "vue";

import { getAccounts, getBalance, getChainId, sendEth, signEthMessage, signTransaction } from "../lib/eth";

export default defineComponent({
  name: "EthRpc",
  props: ["provider", "console", "connectedAdapter", "web3auth"],
  components: {
    Button,
    Badge,
  },
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
        await this.web3auth.switchChain({ chainId: "0x89" });
        this.console("switchedChain");
      } catch (error) {
        console.log("error while switching chain", error);
        this.console("switchedChain error", error);
      }
    },
    async addChain() {
      try {
        await this.web3auth.addChain(getEvmChainConfig(137));
        this.console("added chain");
      } catch (error) {
        console.log("error while adding chain", error);
        this.console("add chain error", error);
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
</style>
