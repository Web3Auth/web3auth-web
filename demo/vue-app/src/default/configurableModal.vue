<template>
  <div id="app">
    <ChainContainer :plugins="plugins" :openloginNetwork="openloginNetwork" :adapterConfig="adapterConfig" :chain="chain"></ChainContainer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import ChainContainer from "../chains/chainContainer.vue";

export default Vue.extend({
  name: "ConfigurableExample",
  props: {
    chain: {
      type: String,
      default: "ethereum",
    },
    plugins: {
      type: Object,
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
    ChainContainer,
  },
});
</script>
