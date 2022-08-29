<template>
  <Ethereum :plugins="plugins" :openloginNetwork="openloginNetwork" :adapterConfig="adapterConfig" v-if="chain === 'ethereum'" />
  <Solana :plugins="plugins" :openloginNetwork="openloginNetwork" :adapterConfig="adapterConfig" v-else-if="chain === 'solana'" />
  <Matic :plugins="plugins" :openloginNetwork="openloginNetwork" :adapterConfig="adapterConfig" v-else-if="chain === 'polygon'" />
  <Binance :plugins="plugins" :openloginNetwork="openloginNetwork" :adapterConfig="adapterConfig" v-else-if="chain === 'binance'" />
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ChainContainer",
  props: {
    plugins: {
      type: Object,
    },
    chain: {
      type: String,
      default: "ethereum",
    },
    adapterConfig: {
      type: Object,
    },
    openloginNetwork: {
      type: String,
      default: "testnet",
    },
  },
  data() {
    return {};
  },
  components: {
    Ethereum: () => import("./ethereum.vue"),
    Solana: () => import("./solana.vue"),
    Matic: () => import("./matic.vue"),
    Binance: () => import("./binance.vue"),
  },
  async mounted() {
    console.log("chain", this.chain);
  },
  methods: {},
});
</script>
