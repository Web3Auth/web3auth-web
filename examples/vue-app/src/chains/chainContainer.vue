<template>
  <Ethereum :adapterConfig="adapterConfig" v-if="chain === 'ethereum'" />
  <Solana :adapterConfig="adapterConfig" v-else-if="chain === 'solana'" />
  <Matic :adapterConfig="adapterConfig" v-else-if="chain === 'polygon'" />
  <Binance :adapterConfig="adapterConfig" v-else-if="chain === 'binance'" />
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
    adapterConfig: {
      type: Object,
    },
  },
  data() {
    return {};
  },
  components: {
    Ethereum,

    Solana,
    Matic,
    Binance,
  },
  async mounted() {
    console.log("chain", this.chain);
  },
  methods: {},
});
</script>
