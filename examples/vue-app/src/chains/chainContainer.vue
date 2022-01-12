<template>
  <Ethereum v-if="chain === 'ethereum'" />
  <Solana v-else-if="chain === 'solana'" />
  <Matic v-else-if="chain === 'polygon'" />
  <Binance v-else-if="chain === 'binance'" />
</template>

<script lang="ts">
import Vue from "vue";

import Binance from "./binance.vue";
import Ethereum from "./ethereum.vue";
import Matic from "./matic.vue";
import Solana from "./solana.vue";

export default Vue.extend({
  name: "ChainContainer",
  props: {
    chain: {
      type: String,
      default: "ethereum",
    },
  },
  data() {
    return {};
  },
  components: {
    Solana,
    Ethereum,
    Matic,
    Binance,
  },
  async mounted() {
    console.log("chain", this.chain);
  },
  methods: {},
});
</script>
