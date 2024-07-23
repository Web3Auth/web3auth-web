<template>
  <Ethereum v-if="chain === 'ethereum'" :plugins="plugins" :openlogin-network="openloginNetwork" :adapter-config="adapterConfig" />
  <Solana v-else-if="chain === 'solana'" :plugins="plugins" :openlogin-network="openloginNetwork" :adapter-config="adapterConfig" />
  <Matic v-else-if="chain === 'polygon'" :plugins="plugins" :openlogin-network="openloginNetwork" :adapter-config="adapterConfig" />
  <Binance v-else-if="chain === 'binance'" :plugins="plugins" :openlogin-network="openloginNetwork" :adapter-config="adapterConfig" />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Binance from "./binance.vue";
import Ethereum from "./ethereum.vue";
import Matic from "./matic.vue";
import Solana from "./solana.vue";

export default defineComponent({
  name: "ChainContainer",
  components: {
    Ethereum,
    Solana,
    Matic,
    Binance,
  },
  props: {
    plugins: {
      type: Object,
      default: () => ({}),
    },
    chain: {
      type: String,
      default: "ethereum",
    },
    adapterConfig: {
      type: Object,
      default: () => ({}),
    },
    openloginNetwork: {
      type: String,
      default: "testnet",
    },
  },
  data() {
    return {};
  },
  methods: {},
});
</script>
