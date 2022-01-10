<template>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button  @click="onSignAndSendTransaction" style="cursor: pointer;">Sign and send txn</button>
      <button  @click="onSignTransaction" style="cursor: pointer;">Sign txn</button>
      <button  @click="onSignMessage" style="cursor: pointer;">Sign Message</button>

    </section>
</template>

<script lang="ts">
import Vue from "vue";
import { signAndSendTransaction, signTransaction, signMessage } from "./lib/sol"

export default Vue.extend({
  name: "SolRpc",
  props: ['provider', 'console'],
  data() {
    return {
    };
  },
  methods: {
    async onSignAndSendTransaction() {
        await signAndSendTransaction(this.provider, this.console)
    },
    async onSignTransaction() {
        await signTransaction(this.provider, this.console)
    },
    async onSignMessage() {
        await signMessage(this.provider, this.console)
    },
  }
});
</script>