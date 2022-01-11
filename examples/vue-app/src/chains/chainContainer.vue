<template>
 <Ethereum v-if="chain === 'ethereum'"/>
  <Solana v-else-if="chain === 'solana'"/>
  <Polygon v-else-if="chain === 'polygon'"/>
  <Binance v-else-if="chain === 'binance'"/>

</template>

<script lang="ts">
import Vue from "vue";

import Solana from "./solana.vue";
import Ethereum from "./ethereum.vue";
import Polygon from "./polygon.vue";
import Binance from "./binance.vue";

export default Vue.extend({
  name: "ChainContainer",
  props: {
    chain: {
        type: String,
        default: "ethereum"
    }
  },
  data() {
    return {
    };
  },
  components: {
    Solana,
    Ethereum,
    Polygon,
    Binance
},
  async mounted() {
      console.log("chain", this.chain)
  },
  methods: {
   
  },
});
</script>
