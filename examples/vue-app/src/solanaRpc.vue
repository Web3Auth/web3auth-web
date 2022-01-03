<template>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button  @click="onSignAndSendTransaction" style="cursor: pointer;">Sign and send txn</button>

    </section>
</template>

<script lang="ts">
import Vue from "vue";
import { signAndSendTransaction } from "./lib/sol"

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
  }
});
</script>